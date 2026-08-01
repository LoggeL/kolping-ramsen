/**
 * Serialize structured data for embedding inside an HTML script element.
 *
 * JSON.stringify alone leaves `<` untouched, so an editor-controlled value
 * containing `</script>` could terminate the JSON-LD element and inject HTML.
 * Escaping HTML-significant characters keeps the JSON valid while preventing
 * the HTML parser from seeing an end tag.
 */
export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) {
    throw new TypeError("JSON-LD value is not serializable");
  }

  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
