import swaggerJsDoc from "swagger-jsdoc";
import {
  userRequestSchema,
  userResponseSchema,
  locationSchema,
  appointmentSchema,
  questionnaireSchema,
} from "./swaggerSchema";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Blood Donor Backend API",
      version: "1.0.0",
      description: "API documentation for the Blood Donor Backend",
    },
    servers: [
      {
        url: `${process.env.BASE_URL}/api/v1`,
      },
    ],
    components: {
      schemas: {
        UserRequest: userRequestSchema,
        UserResponse: userResponseSchema,
        Location: locationSchema,
        Appointment: appointmentSchema,
        Questionnaire: questionnaireSchema,
      },
    },
  },
  apis: ["./routes/v1/*.ts", "./swagger/swaggerRoutes.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;
