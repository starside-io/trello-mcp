/**
 * Checklist Validation Utilities
 * Provides comprehensive validation for checklist-related operations
 */

interface ChecklistValidationError {
  field: string;
  message: string;
  expectedFormat?: string;
}

interface ChecklistItemParameters {
  checklistId: string;
  name: string;
  pos?: string | number;
  checked?: boolean;
  due?: string;
  dueReminder?: number;
  idMember?: string;
}

interface BatchChecklistItemParameters {
  checklistId: string;
  items: ChecklistItemForBatch[];
}

interface ChecklistItemForBatch {
  name: string;
  pos?: string | number;
  checked?: boolean;
  due?: string;
  dueReminder?: number;
  idMember?: string;
}

export class ChecklistValidation {
  /**
   * Validate checklist ID format (24-character hexadecimal)
   */
  static isValidChecklistId(checklistId: string): boolean {
    const checklistIdRegex = /^[0-9a-fA-F]{24}$/;
    return checklistIdRegex.test(checklistId);
  }

  /**
   * Validate member ID format (24-character hexadecimal)
   */
  static isValidMemberId(memberId: string): boolean {
    const memberIdRegex = /^[0-9a-fA-F]{24}$/;
    return memberIdRegex.test(memberId);
  }

  /**
   * Validate item name
   */
  static isValidItemName(name: string): boolean {
    return typeof name === "string" && name.trim().length > 0 && name.length <= 16384;
  }

  /**
   * Validate position parameter
   */
  static isValidPosition(pos: string | number): boolean {
    if (typeof pos === "string") {
      return pos === "top" || pos === "bottom";
    }
    if (typeof pos === "number") {
      return pos >= 0;
    }
    return false;
  }

  /**
   * Validate due date format (ISO 8601)
   */
  static isValidDueDate(due: string): boolean {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!iso8601Regex.test(due)) {
      return false;
    }
    const date = new Date(due);
    return !isNaN(date.getTime());
  }

  /**
   * Validate due reminder (must be positive number representing minutes)
   */
  static isValidDueReminder(dueReminder: number): boolean {
    return typeof dueReminder === "number" && dueReminder >= 0;
  }

  /**
   * Validate all checklist item parameters
   */
  static validateChecklistItemParameters(params: ChecklistItemParameters): ChecklistValidationError[] {
    const errors: ChecklistValidationError[] = [];

    // Validate required checklistId
    if (!params.checklistId) {
      errors.push({
        field: "checklistId",
        message: "Checklist ID is required",
        expectedFormat: "24-character hexadecimal string",
      });
    } else if (!this.isValidChecklistId(params.checklistId)) {
      errors.push({
        field: "checklistId",
        message: "Invalid checklist ID format",
        expectedFormat: "24-character hexadecimal string",
      });
    }

    // Validate required name
    if (!params.name) {
      errors.push({
        field: "name",
        message: "Item name is required",
        expectedFormat: "Non-empty string up to 16384 characters",
      });
    } else if (!this.isValidItemName(params.name)) {
      errors.push({
        field: "name",
        message: "Invalid item name format",
        expectedFormat: "Non-empty string up to 16384 characters",
      });
    }

    // Validate optional pos
    if (params.pos !== undefined && !this.isValidPosition(params.pos)) {
      errors.push({
        field: "pos",
        message: "Invalid position format",
        expectedFormat: '"top", "bottom", or positive number',
      });
    }

    // Validate optional checked
    if (params.checked !== undefined && typeof params.checked !== "boolean") {
      errors.push({
        field: "checked",
        message: "Invalid checked format",
        expectedFormat: "Boolean value (true or false)",
      });
    }

    // Validate optional due
    if (params.due !== undefined && !this.isValidDueDate(params.due)) {
      errors.push({
        field: "due",
        message: "Invalid due date format",
        expectedFormat: "ISO 8601 date string (e.g., '2023-12-31T23:59:59.000Z')",
      });
    }

    // Validate optional dueReminder
    if (params.dueReminder !== undefined && !this.isValidDueReminder(params.dueReminder)) {
      errors.push({
        field: "dueReminder",
        message: "Invalid due reminder format",
        expectedFormat: "Positive number representing minutes",
      });
    }

    // Validate optional idMember
    if (params.idMember !== undefined && !this.isValidMemberId(params.idMember)) {
      errors.push({
        field: "idMember",
        message: "Invalid member ID format",
        expectedFormat: "24-character hexadecimal string",
      });
    }

    return errors;
  }

  /**
   * Validate batch size limits
   */
  static isValidBatchSize(items: unknown[]): boolean {
    return Array.isArray(items) && items.length > 0 && items.length <= 50;
  }

  /**
   * Validate batch checklist items parameters
   */
  static validateBatchChecklistItemParameters(params: BatchChecklistItemParameters): ChecklistValidationError[] {
    const errors: ChecklistValidationError[] = [];

    // Validate required checklistId
    if (!params.checklistId) {
      errors.push({
        field: "checklistId",
        message: "Checklist ID is required",
        expectedFormat: "24-character hexadecimal string",
      });
    } else if (!this.isValidChecklistId(params.checklistId)) {
      errors.push({
        field: "checklistId",
        message: "Invalid checklist ID format",
        expectedFormat: "24-character hexadecimal string",
      });
    }

    // Validate items array
    if (!params.items) {
      errors.push({
        field: "items",
        message: "Items array is required",
        expectedFormat: "Array of checklist item objects (1-50 items)",
      });
    } else if (!Array.isArray(params.items)) {
      errors.push({
        field: "items",
        message: "Items must be an array",
        expectedFormat: "Array of checklist item objects (1-50 items)",
      });
    } else if (!this.isValidBatchSize(params.items)) {
      errors.push({
        field: "items",
        message: "Invalid batch size",
        expectedFormat: "Array with 1-50 checklist item objects",
      });
    } else {
      // Validate each item in the batch
      params.items.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          errors.push({
            field: `items[${index}]`,
            message: "Invalid item format",
            expectedFormat: "Object with at least 'name' property",
          });
          return;
        }

        // Create a mock ChecklistItemParameters object for validation
        const itemParams: ChecklistItemParameters = {
          checklistId: params.checklistId, // Use parent checklistId
          name: item.name,
          pos: item.pos,
          checked: item.checked,
          due: item.due,
          dueReminder: item.dueReminder,
          idMember: item.idMember,
        };

        // Validate the individual item (excluding checklistId since it's from parent)
        const itemErrors = this.validateChecklistItemParameters(itemParams)
          .filter(error => error.field !== "checklistId") // Remove checklistId errors since it's validated at parent level
          .map(error => ({
            ...error,
            field: `items[${index}].${error.field}`, // Add array index to field name
          }));

        errors.push(...itemErrors);
      });
    }

    return errors;
  }
}
