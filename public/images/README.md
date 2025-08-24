# Pest and Disease Reference Images

This directory contains reference images for pest and disease identification.

## Directory Structure

- `pests/` - Images of common agricultural pests
- `diseases/` - Images of plant diseases and symptoms
- `deficiencies/` - Images showing nutrient deficiency symptoms

## Image Naming Convention

Images should be named using the following pattern:
- `{pest_disease_key}_{description}.jpg`
- Example: `aphids_on_leaves.jpg`, `powdery_mildew_severe.jpg`

## Image Requirements

- Format: JPG or PNG
- Resolution: Minimum 800x600 pixels
- File size: Maximum 2MB per image
- Quality: Clear, well-lit images showing symptoms or pest characteristics

## Adding New Images

1. Place images in the appropriate subdirectory
2. Update the corresponding entry in `src/data/pestsAndDiseases.json`
3. Use relative paths starting with `/images/`

## Image Sources

All images should be:
- Original photographs
- Creative Commons licensed
- Properly attributed if required
- Relevant to the pest/disease entry

## Placeholder Images

Currently using placeholder images. Replace with actual photographs of:
- Pest specimens and damage
- Disease symptoms on various crops
- Nutrient deficiency symptoms
- Treatment application examples