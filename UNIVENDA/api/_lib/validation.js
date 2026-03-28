function trimText(value) {
  return String(value || "").trim();
}

function trimLower(value) {
  return trimText(value).toLowerCase();
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeOptionalText(value) {
  const normalized = trimText(value);
  return normalized || null;
}

function normalizeAddress(value) {
  const normalized = trimText(value);
  return normalized || null;
}

function isAcademicEmail(email) {
  return /(\.edu(\.[a-z]{2})?$|\.ac\.[a-z]{2}$|college|university|campus|edu\.in$)/i.test(email);
}

function validateFilePayload(file, label, { required = false, maxSizeBytes = 2 * 1024 * 1024 } = {}) {
  if (!file || typeof file !== "object") {
    return required ? { valid: false, error: `${label} is required.` } : { valid: true, value: null };
  }

  const name = trimText(file.name);
  const type = trimText(file.type);
  const dataUrl = trimText(file.dataUrl);
  const size = Number(file.size);

  if (!name || !type || !dataUrl) {
    return { valid: false, error: `${label} is incomplete.` };
  }

  if (!dataUrl.startsWith("data:")) {
    return { valid: false, error: `${label} must be uploaded as a valid file.` };
  }

  if (!Number.isFinite(size) || size <= 0 || size > maxSizeBytes) {
    return { valid: false, error: `${label} must be smaller than ${Math.round(maxSizeBytes / (1024 * 1024))} MB.` };
  }

  return {
    valid: true,
    value: {
      name,
      type,
      size,
      dataUrl,
    },
  };
}

export function validateCredentials({ email, password }) {
  const normalizedEmail = trimLower(email);
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    return { valid: false, error: "Email and password are required." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    return { valid: false, error: "Enter a valid email address." };
  }

  if (normalizedPassword.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }

  return {
    valid: true,
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

export function validateCustomerRegistration(payload) {
  const credentials = validateCredentials(payload);
  if (!credentials.valid) {
    return credentials;
  }

  const fullName = trimText(payload?.fullName);
  const phoneNumber = normalizeDigits(payload?.phoneNumber);
  const address = normalizeAddress(payload?.address);

  if (!fullName || !phoneNumber || !address) {
    return { valid: false, error: "Full name, phone number, and address are required." };
  }

  if (fullName.length < 2 || fullName.length > 120) {
    return { valid: false, error: "Full name must be between 2 and 120 characters." };
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    return { valid: false, error: "Phone number must be exactly 10 digits." };
  }

  if (address.length < 10 || address.length > 400) {
    return { valid: false, error: "Address must be between 10 and 400 characters." };
  }

  return {
    valid: true,
    email: credentials.email,
    password: credentials.password,
    data: {
      fullName,
      phoneNumber,
      address,
    },
  };
}

export function validateSellerRegistration(payload) {
  const credentials = validateCredentials(payload);
  if (!credentials.valid) {
    return credentials;
  }

  const fullName = trimText(payload?.fullName);
  const phoneNumber = normalizeDigits(payload?.phoneNumber);
  const alternatePhoneNumber = normalizeDigits(payload?.alternatePhoneNumber);
  const collegeName = trimText(payload?.collegeName);
  const course = trimText(payload?.course);
  const purpose = trimText(payload?.purpose);
  const aadhaarNumber = normalizeDigits(payload?.aadhaarNumber);
  const accountNumber = normalizeDigits(payload?.accountNumber);
  const ifscCode = trimUpper(payload?.ifscCode);
  const graduationYear = Number.parseInt(String(payload?.graduationYear || ""), 10);
  const profilePhoto = validateFilePayload(payload?.profilePhoto, "Profile photo", {
    required: true,
    maxSizeBytes: 2 * 1024 * 1024,
  });
  const approvalDocument = validateFilePayload(payload?.approvalDocument, "College approval document", {
    required: true,
    maxSizeBytes: 4 * 1024 * 1024,
  });

  if (!fullName || !phoneNumber || !alternatePhoneNumber || !collegeName || !course || !purpose) {
    return { valid: false, error: "Complete all required student registration fields." };
  }

  if (fullName.length < 2 || fullName.length > 120) {
    return { valid: false, error: "Full name must be between 2 and 120 characters." };
  }

  if (!isAcademicEmail(credentials.email)) {
    return { valid: false, error: "Use a valid college email address for student registration." };
  }

  if (!/^\d{10}$/.test(phoneNumber) || !/^\d{10}$/.test(alternatePhoneNumber)) {
    return { valid: false, error: "Phone numbers must be exactly 10 digits." };
  }

  if (!/^\d{12}$/.test(aadhaarNumber)) {
    return { valid: false, error: "Aadhaar number must be exactly 12 digits." };
  }

  if (!/^\d{9,18}$/.test(accountNumber)) {
    return { valid: false, error: "Account number must be between 9 and 18 digits." };
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
    return { valid: false, error: "Enter a valid IFSC code." };
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(graduationYear) || graduationYear < currentYear - 1 || graduationYear > currentYear + 10) {
    return { valid: false, error: "Enter a valid graduation year." };
  }

  if (!profilePhoto.valid) {
    return profilePhoto;
  }

  if (!approvalDocument.valid) {
    return approvalDocument;
  }

  return {
    valid: true,
    email: credentials.email,
    password: credentials.password,
    data: {
      fullName,
      phoneNumber,
      alternatePhoneNumber,
      collegeName,
      course,
      graduationYear,
      purpose,
      aadhaarNumber,
      accountNumber,
      ifscCode,
      profilePhoto: profilePhoto.value,
      approvalDocument: approvalDocument.value,
    },
  };
}

function trimUpper(value) {
  return trimText(value).toUpperCase();
}

function normalizeMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
}

function normalizePositiveInteger(value) {
  const amount = Number.parseInt(String(value || ""), 10);

  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function normalizeImageList(images) {
  if (typeof images === "string") {
    return images
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(images)) {
    return [];
  }

  return images.map((value) => String(value || "").trim()).filter(Boolean);
}

export function validateProductInput(payload) {
  const title = trimText(payload?.title);
  const description = trimText(payload?.description);
  const category = trimText(payload?.category);
  const images = normalizeImageList(payload?.images);
  const price = normalizeMoney(payload?.price);

  if (!title || !description || !category || price === null) {
    return {
      valid: false,
      error: "Title, description, price, and category are required.",
    };
  }

  if (title.length > 120) {
    return { valid: false, error: "Product title must be 120 characters or fewer." };
  }

  if (description.length > 2000) {
    return { valid: false, error: "Product description must be 2000 characters or fewer." };
  }

  if (category.length > 80) {
    return { valid: false, error: "Product category must be 80 characters or fewer." };
  }

  if (images.length > 6) {
    return { valid: false, error: "Add up to 6 product image URLs." };
  }

  return {
    valid: true,
    data: {
      title,
      description,
      price,
      category,
      images,
      selfMadeDeclaration: true,
    },
  };
}

export function validateServiceInput(payload) {
  const skillTitle = trimText(payload?.skillTitle);
  const description = trimText(payload?.description);
  const pricing = normalizeMoney(payload?.pricing);
  const deliveryTime = normalizePositiveInteger(payload?.deliveryTime);

  if (!skillTitle || !description || pricing === null || deliveryTime === null) {
    return {
      valid: false,
      error: "Skill title, description, pricing, and delivery time are required.",
    };
  }

  if (skillTitle.length > 120) {
    return { valid: false, error: "Skill title must be 120 characters or fewer." };
  }

  if (description.length > 2000) {
    return { valid: false, error: "Service description must be 2000 characters or fewer." };
  }

  return {
    valid: true,
    data: {
      skillTitle,
      description,
      pricing,
      deliveryTime,
    },
  };
}
