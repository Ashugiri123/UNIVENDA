import { encryptSensitiveField, USER_ROLES, VERIFICATION_STATUSES } from "./auth.js";

function getSupabaseConfig() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase credentials. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    url: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function supabaseRequest(path, init = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(init.headers || {}),
    },
  });

  return response;
}

async function parseSingleRow(response, fallbackError) {
  if (!response.ok) {
    const details = await response.text();
    const error = new Error(details || fallbackError);
    error.status = response.status;
    throw error;
  }

  const rows = await response.json();
  return rows[0] || null;
}

async function parseRows(response, fallbackError) {
  if (!response.ok) {
    throw new Error((await response.text()) || fallbackError);
  }

  return response.json();
}

const USER_SELECT_FIELDS = [
  "id",
  "email",
  "password_hash",
  "role",
  "capabilities",
  "created_at",
  "full_name",
  "phone_number",
  "verification_status",
].join(",");

export async function findUserByEmail(email) {
  const query = new URLSearchParams({
    select: USER_SELECT_FIELDS,
    email: `eq.${email}`,
    limit: "1",
  });
  const response = await supabaseRequest(`/rest/v1/users?${query.toString()}`, {
    method: "GET",
  });

  return parseSingleRow(response, "Supabase could not fetch the user.");
}

export async function findUserById(id) {
  const query = new URLSearchParams({
    select: USER_SELECT_FIELDS,
    id: `eq.${id}`,
    limit: "1",
  });
  const response = await supabaseRequest(`/rest/v1/users?${query.toString()}`, {
    method: "GET",
  });

  return parseSingleRow(response, "Supabase could not fetch the user.");
}

export async function createUser({ email, passwordHash, role, capabilities, profile = {} }) {
  const isCustomer = role === USER_ROLES.CUSTOMER;
  const isSeller = role === USER_ROLES.SELLER || role === USER_ROLES.STUDENT;
  const response = await supabaseRequest("/rest/v1/users", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      email,
      password_hash: passwordHash,
      role,
      capabilities,
      full_name: profile.fullName || null,
      phone_number: profile.phoneNumber || null,
      alternate_phone_number: isSeller ? profile.alternatePhoneNumber || null : null,
      college_name: isSeller ? profile.collegeName || null : null,
      course: isSeller ? profile.course || null : null,
      graduation_year: isSeller ? profile.graduationYear || null : null,
      purpose_of_joining: isSeller ? profile.purpose || null : null,
      address: isCustomer ? profile.address || null : null,
      verification_status: isSeller
        ? VERIFICATION_STATUSES.UNVERIFIED
        : VERIFICATION_STATUSES.VERIFIED,
      sensitive_profile: isSeller
        ? {
            aadhaarNumber: encryptSensitiveField(profile.aadhaarNumber),
            bankDetails: encryptSensitiveField({
              accountNumber: profile.accountNumber,
              ifscCode: profile.ifscCode,
            }),
            profilePhoto: encryptSensitiveField(profile.profilePhoto),
            approvalDocument: encryptSensitiveField(profile.approvalDocument),
          }
        : {},
    }),
  });

  return parseSingleRow(response, "Supabase rejected the user insert.");
}

function mapProductRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    category: row.category,
    images: Array.isArray(row.images) ? row.images : [],
    selfMadeDeclaration: row.self_made_declaration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapServiceRow(row) {
  return {
    id: row.id,
    skillTitle: row.skill_title,
    description: row.description,
    pricing: row.pricing,
    deliveryTime: row.delivery_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProductsByUser(userId) {
  const query = new URLSearchParams({
    select: "id,title,description,price,category,images,self_made_declaration,created_at,updated_at",
    user_id: `eq.${userId}`,
    order: "updated_at.desc",
  });

  const response = await supabaseRequest(`/rest/v1/products?${query.toString()}`, {
    method: "GET",
  });

  const rows = await parseRows(response, "Supabase could not fetch products.");
  return rows.map(mapProductRow);
}

export async function createProduct(userId, product) {
  const response = await supabaseRequest("/rest/v1/products", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      self_made_declaration: product.selfMadeDeclaration,
    }),
  });

  const row = await parseSingleRow(response, "Supabase rejected the product insert.");
  return row ? mapProductRow(row) : null;
}

export async function updateProductByIdAndUser(productId, userId, product) {
  const query = new URLSearchParams({
    id: `eq.${productId}`,
    user_id: `eq.${userId}`,
    select: "id,title,description,price,category,images,self_made_declaration,created_at,updated_at",
  });

  const response = await supabaseRequest(`/rest/v1/products?${query.toString()}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      self_made_declaration: product.selfMadeDeclaration,
    }),
  });

  const row = await parseSingleRow(response, "Supabase rejected the product update.");
  return row ? mapProductRow(row) : null;
}

export async function deleteProductByIdAndUser(productId, userId) {
  const query = new URLSearchParams({
    id: `eq.${productId}`,
    user_id: `eq.${userId}`,
  });

  const response = await supabaseRequest(`/rest/v1/products?${query.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Supabase rejected the product delete.");
  }
}

export async function listServicesByUser(userId) {
  const query = new URLSearchParams({
    select: "id,skill_title,description,pricing,delivery_time,created_at,updated_at",
    user_id: `eq.${userId}`,
    order: "updated_at.desc",
  });

  const response = await supabaseRequest(`/rest/v1/freelance_services?${query.toString()}`, {
    method: "GET",
  });

  const rows = await parseRows(response, "Supabase could not fetch services.");
  return rows.map(mapServiceRow);
}

export async function createService(userId, service) {
  const response = await supabaseRequest("/rest/v1/freelance_services", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      skill_title: service.skillTitle,
      description: service.description,
      pricing: service.pricing,
      delivery_time: service.deliveryTime,
    }),
  });

  const row = await parseSingleRow(response, "Supabase rejected the service insert.");
  return row ? mapServiceRow(row) : null;
}

export async function updateServiceByIdAndUser(serviceId, userId, service) {
  const query = new URLSearchParams({
    id: `eq.${serviceId}`,
    user_id: `eq.${userId}`,
    select: "id,skill_title,description,pricing,delivery_time,created_at,updated_at",
  });

  const response = await supabaseRequest(`/rest/v1/freelance_services?${query.toString()}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      skill_title: service.skillTitle,
      description: service.description,
      pricing: service.pricing,
      delivery_time: service.deliveryTime,
    }),
  });

  const row = await parseSingleRow(response, "Supabase rejected the service update.");
  return row ? mapServiceRow(row) : null;
}

export async function deleteServiceByIdAndUser(serviceId, userId) {
  const query = new URLSearchParams({
    id: `eq.${serviceId}`,
    user_id: `eq.${userId}`,
  });

  const response = await supabaseRequest(`/rest/v1/freelance_services?${query.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Supabase rejected the service delete.");
  }
}
