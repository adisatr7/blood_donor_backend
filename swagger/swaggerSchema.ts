export const userRequestSchema = {
  type: "object",
  properties: {
    secretKey: { type: "string" },
    nik: { type: "string" },
    name: { type: "string" },
    profilePicture: { type: "string" },
    birthPlace: { type: "string" },
    birthDate: { type: "string", format: "date-time" },
    gender: { type: "string", enum: ["MALE", "FEMALE"] },
    job: { type: "string" },
    phoneNumber: { type: "string" },
    weightKg: { type: "number" },
    heightCm: { type: "number" },
    bloodType: { type: "string", enum: ["A", "B", "AB", "O"] },
    rhesus: { type: "string", enum: ["POSITIVE", "NEGATIVE"] },
    address: { type: "string" },
    noRt: { type: "integer" },
    noRw: { type: "integer" },
    village: { type: "string" },
    district: { type: "string" },
    city: { type: "string" },
    province: { type: "string" },
  },
};

export const userResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    nik: { type: "string" },
    name: { type: "string" },
    profilePicture: { type: "string" },
    birthPlace: { type: "string" },
    birthDate: { type: "string", format: "date-time" },
    gender: { type: "string", enum: ["MALE", "FEMALE"] },
    job: { type: "string" },
    phoneNumber: { type: "string" },
    weightKg: { type: "number" },
    heightCm: { type: "number" },
    bloodType: { type: "string", enum: ["A", "B", "AB", "O"] },
    rhesus: { type: "string", enum: ["POSITIVE", "NEGATIVE"] },
    address: { type: "string" },
    noRt: { type: "integer" },
    noRw: { type: "integer" },
    village: { type: "string" },
    district: { type: "string" },
    city: { type: "string" },
    province: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    Appointments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          status: { type: "string", enum: ["SCHEDULED", "ATTENDED", "MISSED"] },
          Location: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              startTime: { type: "string", format: "date-time" },
              endTime: { type: "string", format: "date-time" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          pdfUrl: { type: "string" },
          Questionnaire: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "integer" },
                question: { type: "string" },
                answer: { type: "string" },
              },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export const locationSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    startTime: { type: "string", format: "date-time" },
    endTime: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: { type: "string", format: "date-time" },
  },
};

export const appointmentSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    locationId: { type: "integer" },
    status: { type: "string", enum: ["SCHEDULED", "ATTENDED", "MISSED"] },
    pdfUrl: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

export const questionnaireSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    appointmentId: { type: "integer" },
    number: { type: "integer" },
    question: { type: "string" },
    answer: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};
