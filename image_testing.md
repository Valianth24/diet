# Image Integration Testing Playbook

## Image Handling Rules
- Always use base64-encoded images for all tests and requests
- Accepted formats: JPEG, PNG, WEBP only
- Do not use SVG, BMP, HEIC, or other formats
- Every image must contain real visual features (objects, edges, textures, shadows)
- If not PNG/JPEG/WEBP, transcode to PNG or JPEG before upload
- If animated (GIF, APNG, WEBP), extract first frame only
- Resize large images to reasonable bounds

## Testing Steps
1. Test with sample food image (JPEG/PNG)
2. Convert to base64
3. Send to /api/food/analyze endpoint
4. Verify response contains:
   - calories (number)
   - protein (grams)
   - carbs (grams)
   - fat (grams)
   - description (string)
5. Ensure image displays correctly in UI

## Sample Test
```bash
# Test food analysis
curl -X POST "https://your-app.com/api/food/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "image_base64": "data:image/jpeg;base64,YOUR_BASE64_STRING"
  }'
```
