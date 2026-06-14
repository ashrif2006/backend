/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * On failure it returns a 400 response with structured error details.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  // Replace req.body with the parsed (trimmed / lowercased) data
  req.body = result.data;
  next();
};

module.exports = validate;
