import type { BloodType, Gender, Rhesus } from "../prisma/client"

export default class UserValidation {
  /**
   * Method helper untuk memvalidasi jenis kelamin/gender
   */
  static validateGender(gender: string | null) {
    if (!gender) {
      return null;
    }

    if (gender.toUpperCase() === "MALE" || gender.toUpperCase() === "FEMALE") {
      return gender.toUpperCase() as Gender;
    }

    console.error("Error: Format jenis kelamin tidak dikenali. Gunakan `MALE` atau `FEMALE`");
    throw new Error("Format jenis kelamin tidak dikenali. Hubungi pihak developer untuk bantuan");
  }

  /**
   * Method helper untuk memvalidasi golongan darah
   */
  static validateBloodType(bloodType: string | null) {
    if (!bloodType) {
      return null;
    }

    const _bloodType = bloodType.trim().toUpperCase();

    if (["A", "B", "AB", "O"].includes(_bloodType)) {
      return _bloodType as BloodType;
    }

    console.error("Error: Format golongan darah tidak dikenali. Gunakan `A`, `B`, `AB`, atau `O`");
    throw new Error("Format golongan darah tidak dikenali. Hubungi pihak developer untuk bantuan");
  }

  /**
   * Method helper untuk memvalidasi rhesus
   */
  static validateRhesus(rhesus: string | null) {
    if (!rhesus) {
      return null;
    }

    const _rhesus = rhesus.trim().toUpperCase();

    if (["POSITIVE", "NEGATIVE"].includes(_rhesus)) {
      return _rhesus as Rhesus;
    }

    console.error("Format rhesus tidak dikenali. Gunakan `POSITIVE` atau `NEGATIVE`")
    throw new Error("Format rhesus tidak dikenali. Hubungi pihak developer untuk bantuan");
  }
}
