/**
 * Card Validation Utilities
 * Provides comprehensive validation for card update parameters
 */

interface ValidationError {
  field: string;
  message: string;
  expectedFormat?: string;
}

interface UpdateParameters {
  cardId: string;
  name?: string;
  desc?: string;
  closed?: boolean;
  idList?: string;
  idBoard?: string;
  pos?: string | number;
  due?: string;
  start?: string;
  dueComplete?: boolean;
  idMembers?: string[];
  idLabels?: string[];
}

export class CardValidation {
  /**
   * Validate all card update parameters
   */
  static validateUpdateParameters(params: UpdateParameters): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required cardId
    if (!params.cardId) {
      errors.push({
        field: "cardId",
        message: "Card ID is required",
        expectedFormat: "24-character hexadecimal string",
      });
    } else if (!this.isValidCardId(params.cardId)) {
      errors.push({
        field: "cardId",
        message: "Invalid card ID format",
        expectedFormat: "24-character hexadecimal string",
      });
    }

    // Validate optional name
    if (params.name !== undefined && typeof params.name !== "string") {
      errors.push({
        field: "name",
        message: "Card name must be a string",
      });
    }

    // Validate optional description
    if (params.desc !== undefined && typeof params.desc !== "string") {
      errors.push({
        field: "desc",
        message: "Card description must be a string",
      });
    }

    // Validate optional closed status
    if (params.closed !== undefined && typeof params.closed !== "boolean") {
      errors.push({
        field: "closed",
        message: "Closed status must be a boolean",
      });
    }

    // Validate optional list ID
    if (params.idList !== undefined && !this.isValidId(params.idList)) {
      errors.push({
        field: "idList",
        message: "Invalid list ID format",
        expectedFormat: "24-character hexadecimal string",
      });
    }

    // Validate optional board ID
    if (params.idBoard !== undefined && !this.isValidId(params.idBoard)) {
      errors.push({
        field: "idBoard",
        message: "Invalid board ID format",
        expectedFormat: "24-character hexadecimal string",
      });
    }

    // Validate position
    if (params.pos !== undefined) {
      const posError = this.validatePosition(params.pos);
      if (posError) {
        errors.push(posError);
      }
    }

    // Validate due date
    if (params.due !== undefined) {
      const dueError = this.validateDateString(params.due, "due");
      if (dueError) {
        errors.push(dueError);
      }
    }

    // Validate start date
    if (params.start !== undefined) {
      const startError = this.validateDateString(params.start, "start");
      if (startError) {
        errors.push(startError);
      }
    }

    // Validate due complete status
    if (
      params.dueComplete !== undefined &&
      typeof params.dueComplete !== "boolean"
    ) {
      errors.push({
        field: "dueComplete",
        message: "Due complete status must be a boolean",
      });
    }

    // Validate member IDs array
    if (params.idMembers !== undefined) {
      const memberError = this.validateIdArray(params.idMembers, "idMembers");
      if (memberError) {
        errors.push(memberError);
      }
    }

    // Validate label IDs array
    if (params.idLabels !== undefined) {
      const labelError = this.validateIdArray(params.idLabels, "idLabels");
      if (labelError) {
        errors.push(labelError);
      }
    }

    return errors;
  }

  /**
   * Validate Trello card ID format
   */
  static isValidCardId(cardId: string): boolean {
    return this.isValidId(cardId);
  }

  /**
   * Validate generic Trello ID format (24-character hexadecimal)
   */
  static isValidId(id: string): boolean {
    return /^[a-f0-9]{24}$/i.test(id);
  }

  /**
   * Validate position parameter
   */
  static validatePosition(pos: string | number): ValidationError | null {
    if (typeof pos === "string") {
      if (pos !== "top" && pos !== "bottom") {
        return {
          field: "pos",
          message: "Position string must be 'top' or 'bottom'",
          expectedFormat: "'top', 'bottom', or positive number",
        };
      }
    } else if (typeof pos === "number") {
      if (!Number.isInteger(pos) || pos < 0) {
        return {
          field: "pos",
          message: "Position number must be a non-negative integer",
          expectedFormat: "'top', 'bottom', or positive number",
        };
      }
    } else {
      return {
        field: "pos",
        message: "Position must be a string ('top'/'bottom') or number",
        expectedFormat: "'top', 'bottom', or positive number",
      };
    }
    return null;
  }

  /**
   * Validate ISO 8601 date string
   */
  static validateDateString(
    dateStr: string,
    fieldName: string
  ): ValidationError | null {
    if (typeof dateStr !== "string") {
      return {
        field: fieldName,
        message: `${fieldName} must be a string`,
        expectedFormat:
          "ISO 8601 date string (e.g., '2023-12-31T23:59:59.000Z')",
      };
    }

    // Check if it's a valid ISO 8601 date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return {
        field: fieldName,
        message: `Invalid ${fieldName} date format`,
        expectedFormat:
          "ISO 8601 date string (e.g., '2023-12-31T23:59:59.000Z')",
      };
    }

    // Check if the string matches ISO 8601 format
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!iso8601Regex.test(dateStr)) {
      return {
        field: fieldName,
        message: `${fieldName} must be in ISO 8601 format`,
        expectedFormat:
          "ISO 8601 date string (e.g., '2023-12-31T23:59:59.000Z')",
      };
    }

    return null;
  }

  /**
   * Validate array of IDs
   */
  static validateIdArray(
    idArray: string[],
    fieldName: string
  ): ValidationError | null {
    if (!Array.isArray(idArray)) {
      return {
        field: fieldName,
        message: `${fieldName} must be an array`,
        expectedFormat: "Array of 24-character hexadecimal strings",
      };
    }

    for (let i = 0; i < idArray.length; i++) {
      const id = idArray[i];
      if (typeof id !== "string" || !this.isValidId(id)) {
        return {
          field: fieldName,
          message: `Invalid ID at index ${i} in ${fieldName}`,
          expectedFormat: "Array of 24-character hexadecimal strings",
        };
      }
    }

    return null;
  }

  /**
   * Sanitize input parameters to prevent injection attacks
   */
  static sanitizeParameters(params: UpdateParameters): UpdateParameters {
    const sanitized: UpdateParameters = {
      cardId: params.cardId,
    };

    // Sanitize string fields
    if (params.name !== undefined) {
      sanitized.name = this.sanitizeString(params.name);
    }
    if (params.desc !== undefined) {
      sanitized.desc = this.sanitizeString(params.desc);
    }

    // Copy other fields as-is (they're validated separately)
    if (params.closed !== undefined) sanitized.closed = params.closed;
    if (params.idList !== undefined) sanitized.idList = params.idList;
    if (params.idBoard !== undefined) sanitized.idBoard = params.idBoard;
    if (params.pos !== undefined) sanitized.pos = params.pos;
    if (params.due !== undefined) sanitized.due = params.due;
    if (params.start !== undefined) sanitized.start = params.start;
    if (params.dueComplete !== undefined)
      sanitized.dueComplete = params.dueComplete;
    if (params.idMembers !== undefined)
      sanitized.idMembers = [...params.idMembers];
    if (params.idLabels !== undefined)
      sanitized.idLabels = [...params.idLabels];

    return sanitized;
  }

  /**
   * Basic string sanitization
   */
  static sanitizeString(input: string): string {
    if (typeof input !== "string") return "";

    // Remove potential script tags and other dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }

  /**
   * Generate a summary of changes being made
   */
  static generateChangesSummary(params: UpdateParameters): string[] {
    const changes: string[] = [];

    if (params.name !== undefined)
      changes.push(`name updated to "${params.name}"`);
    if (params.desc !== undefined) changes.push("description updated");
    if (params.closed !== undefined)
      changes.push(`card ${params.closed ? "archived" : "unarchived"}`);
    if (params.idList !== undefined)
      changes.push(`moved to list ${params.idList}`);
    if (params.idBoard !== undefined)
      changes.push(`moved to board ${params.idBoard}`);
    if (params.pos !== undefined)
      changes.push(`position changed to ${params.pos}`);
    if (params.due !== undefined) changes.push(`due date set to ${params.due}`);
    if (params.start !== undefined)
      changes.push(`start date set to ${params.start}`);
    if (params.dueComplete !== undefined)
      changes.push(`due complete status: ${params.dueComplete}`);
    if (params.idMembers !== undefined)
      changes.push(`members updated (${params.idMembers.length} members)`);
    if (params.idLabels !== undefined)
      changes.push(`labels updated (${params.idLabels.length} labels)`);

    return changes;
  }
}
