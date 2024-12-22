import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import { Schema } from 'mongoose';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// MongoDB Schema matching the desired structure
const AppSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  version: { type: String, required: true },
  githubLink: { type: String, required: true },
  apkFile: {
    filename: String,
    dropboxPath: String,  // Added to match the desired schema
    uploadDate: { type: Date, default: Date.now }
  }
});

const App = mongoose.model('App', AppSchema);

// MongoDB connection with proper type handling
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

// Interface for file upload request
interface UploadRequest extends Request {
  file?: Express.Multer.File;
}

// Get all apps endpoint
app.get('/api/apps', async (req: Request, res: Response) => {
  try {
    const apps = await App.find().sort({ 'apkFile.uploadDate': -1 });
    res.json({ success: true, data: apps });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch apps' });
  }
});

// Get featured apps endpoint
app.get('/api/apps/featured', async (req: Request, res: Response) => {
  try {
    const featuredApps = await App.find().sort({ 'apkFile.uploadDate': -1 }).limit(2);
    res.json({ success: true, data: featuredApps });
  } catch (error) {
    console.error('Error fetching featured apps:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured apps' });
  }
});

// Get recently added apps endpoint
app.get('/api/apps/recent', async (req: Request, res: Response) => {
  try {
    const recentApps = await App.find().sort({ 'apkFile.uploadDate': -1 }).limit(4);
    res.json({ success: true, data: recentApps });
  } catch (error) {
    console.error('Error fetching recent apps:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent apps' });
  }
});

// Modified upload endpoint to match desired schema
app.post('/api/upload', upload.single('apk'), async (req: UploadRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { name, description, version, githubLink } = req.body;

    // Validate required fields
    if (!name || !description || !version || !githubLink) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, description, version, and githubLink are required' 
      });
    }

    // Create dropbox path similar to the example
    const dropboxPath = `/apps/${Date.now()}_${req.file.originalname}`;

    // Create MongoDB document matching the desired schema
    const app = new App({
      name,
      description,
      version,
      githubLink,
      apkFile: {
        filename: req.file.originalname,
        dropboxPath: dropboxPath,
        uploadDate: new Date()
      }
    });

    const savedApp = await app.save();

    res.json({ 
      success: true, 
      message: 'App metadata saved successfully',
      data: savedApp
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to save app metadata'
    });
  }
});

// Get single app details endpoint
app.get('/api/apps/:id', async (req: Request, res: Response) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }
    res.json({ success: true, data: app });
  } catch (error) {
    console.error('Error fetching app details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch app details' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});