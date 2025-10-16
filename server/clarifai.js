/* eslint-env node */

/**
 * ==========================================
 * Clarifai AI Detection Handlers
 * ==========================================
 * Face and object detection using Clarifai API
 * Supports both URL and base64 image inputs
 */

import dotenv from 'dotenv';
import { Model, Input } from 'clarifai-nodejs';

dotenv.config();

const PAT = process.env.CLARIFAI_PAT;

if (!PAT) {
  console.error('Missing CLARIFAI_PAT environment variable. Exiting.');
  process.exit(1);
}

// ==========================================
// AI Model Configuration
// ==========================================

// Face Detection Model
const faceModelUrl = 'https://clarifai.com/clarifai/main/models/face-detection';
const faceDetectorModel = new Model({
  url: faceModelUrl,
  authConfig: { pat: PAT },
});

// Object Detection Model
const objectModelUrl = 'https://clarifai.com/clarifai/main/models/general-image-detection';
const objectDetectorModel = new Model({
  url: objectModelUrl,
  authConfig: { pat: PAT },
});

// ==========================================
// Face Detection Handler
// ==========================================

/**
 * Detect faces in an image
 * Supports both URL and base64 image formats
 */
const handleFaceDetect = async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url required' });

    console.log('🔍 Detecting faces in:', image_url.startsWith('data:image') ? 'uploaded image (base64)' : image_url);

    let detectorModelPrediction;

    // Handle base64 images
    if (image_url.startsWith('data:image')) {
      const base64Data = image_url.split(',')[1];
      
      const input = Input.getInputFromBytes({
        inputId: 'upload-' + Date.now(),
        imageBytes: Buffer.from(base64Data, 'base64')
      });
      
      detectorModelPrediction = await faceDetectorModel.predict({
        inputs: [input]
      });
    } else {
      // Handle image URLs
      detectorModelPrediction = await faceDetectorModel.predictByUrl({
        url: image_url,
        inputType: 'image',
      });
    }

    const regions = detectorModelPrediction?.[0]?.data?.regionsList || [];
    const boxes = regions.map(region => {
      const b = region.regionInfo?.boundingBox || {};
      return {
        top_row: b.topRow ?? 0,
        left_col: b.leftCol ?? 0,
        bottom_row: b.bottomRow ?? 0,
        right_col: b.rightCol ?? 0,
      };
    });

    console.log(`✅ Found ${boxes.length} faces`);
    return res.json({ boxes });
  } catch (error) {
    console.error('❌ Face detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// Object Detection Handler
// ==========================================

/**
 * Detect objects in an image
 * Filters: 75%+ confidence only, excludes human body parts
 * Supports both URL and base64 image formats
 */
const handleObjectDetect = async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url required' });

    console.log('🎯 Detecting objects in:', image_url.startsWith('data:image') ? 'uploaded image (base64)' : image_url);

    let detectorModelPrediction;

    // Handle base64 images
    if (image_url.startsWith('data:image')) {
      const base64Data = image_url.split(',')[1];
      
      const input = Input.getInputFromBytes({
        inputId: 'upload-' + Date.now(),
        imageBytes: Buffer.from(base64Data, 'base64')
      });
      
      detectorModelPrediction = await objectDetectorModel.predict({
        inputs: [input]
      });
    } else {
      // Handle image URLs
      detectorModelPrediction = await objectDetectorModel.predictByUrl({
        url: image_url,
        inputType: 'image',
      });
    }

    const regions = detectorModelPrediction?.[0]?.data?.regionsList || [];
    
    // Keywords to filter out (human body parts)
    const blockedKeywords = [
      'human', 'person', 'people', 'man', 'woman', 'boy', 'girl',
      'face', 'head', 'hair', 'eye', 'nose', 'mouth', 'ear', 'lip',
      'forehead', 'cheek', 'chin', 'neck', 'shoulder', 'arm', 'hand',
      'finger', 'leg', 'foot', 'body', 'skin', 'portrait', 'selfie',
      'facial', 'profile'
    ];
    
    const objects = [];
    let filteredCount = 0;
    
    for (const region of regions) {
      const bbox = region.regionInfo?.boundingBox;
      const concepts = region.data?.conceptsList || [];
      
      if (concepts.length > 0) {
        const topConcept = concepts[0];
        const name = topConcept.name.toLowerCase();
        const confidence = topConcept.value;
        
        // Filter: 75%+ confidence only
        if (confidence < 0.75) {
          filteredCount++;
          continue;
        }
        
        // Filter: Exclude human-related keywords
        const isBlocked = blockedKeywords.some(keyword => 
          name.includes(keyword)
        );
        
        if (!isBlocked) {
          objects.push({
            name: topConcept.name,
            confidence: Math.round(confidence * 10000) / 10000,
            top_row: bbox?.topRow ?? 0,
            left_col: bbox?.leftCol ?? 0,
            bottom_row: bbox?.bottomRow ?? 0,
            right_col: bbox?.rightCol ?? 0
          });
          console.log(`  ✓ Kept: ${topConcept.name} (${Math.round(confidence * 100)}%)`);
        } else {
          filteredCount++;
        }
      }
    }

    console.log(`✅ Found ${objects.length} objects with 75%+ confidence (filtered ${filteredCount} items)`);
    return res.json({ objects });
  } catch (error) {
    console.error('❌ Object detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// Combined Detection Handler (NEW!)
// ==========================================

/**
 * Detect BOTH faces and objects in an image
 * Supports URL and base64, plus optional crop area
 */
const handleCombinedDetect = async (req, res) => {
  try {
    const { image_url, cropArea } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url required' });

    console.log('🔍🎯 Detecting faces AND objects in:', image_url.startsWith('data:image') ? 'uploaded image (base64)' : image_url);

    let faceInput, objectInput;

    // Prepare input (base64 or URL)
    if (image_url.startsWith('data:image')) {
      const base64Data = image_url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      faceInput = Input.getInputFromBytes({
        inputId: 'face-' + Date.now(),
        imageBytes: buffer
      });
      
      objectInput = Input.getInputFromBytes({
        inputId: 'object-' + Date.now(),
        imageBytes: buffer
      });
    } else {
      faceInput = { url: image_url, inputType: 'image' };
      objectInput = { url: image_url, inputType: 'image' };
    }

    // Run both detections in parallel
    const [facePrediction, objectPrediction] = await Promise.all([
      image_url.startsWith('data:image') 
        ? faceDetectorModel.predict({ inputs: [faceInput] })
        : faceDetectorModel.predictByUrl(faceInput),
      image_url.startsWith('data:image')
        ? objectDetectorModel.predict({ inputs: [objectInput] })
        : objectDetectorModel.predictByUrl(objectInput)
    ]);

    // Process face results
    const faceRegions = facePrediction?.[0]?.data?.regionsList || [];
    const faces = faceRegions.map(region => {
      const b = region.regionInfo?.boundingBox || {};
      return {
        top_row: b.topRow ?? 0,
        left_col: b.leftCol ?? 0,
        bottom_row: b.bottomRow ?? 0,
        right_col: b.rightCol ?? 0,
      };
    });

    // Process object results (with filtering)
    const objectRegions = objectPrediction?.[0]?.data?.regionsList || [];
    const blockedKeywords = [
      'human', 'person', 'people', 'man', 'woman', 'boy', 'girl',
      'face', 'head', 'hair', 'eye', 'nose', 'mouth', 'ear', 'lip',
      'forehead', 'cheek', 'chin', 'neck', 'shoulder', 'arm', 'hand',
      'finger', 'leg', 'foot', 'body', 'skin', 'portrait', 'selfie',
      'facial', 'profile'
    ];
    
    const objects = [];
    for (const region of objectRegions) {
      const bbox = region.regionInfo?.boundingBox;
      const concepts = region.data?.conceptsList || [];
      
      if (concepts.length > 0) {
        const topConcept = concepts[0];
        const name = topConcept.name.toLowerCase();
        const confidence = topConcept.value;
        
        if (confidence >= 0.75) {
          const isBlocked = blockedKeywords.some(keyword => name.includes(keyword));
          
          if (!isBlocked) {
            objects.push({
              name: topConcept.name,
              confidence: Math.round(confidence * 10000) / 10000,
              top_row: bbox?.topRow ?? 0,
              left_col: bbox?.leftCol ?? 0,
              bottom_row: bbox?.bottomRow ?? 0,
              right_col: bbox?.rightCol ?? 0
            });
          }
        }
      }
    }

    console.log(`✅ Found ${faces.length} faces and ${objects.length} objects`);
    return res.json({ 
      faces: faces,
      boxes: faces, // For backwards compatibility
      objects: objects 
    });
  } catch (error) {
    console.error('❌ Combined detection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// Exports
// ==========================================

export { handleFaceDetect, handleObjectDetect, handleCombinedDetect };
