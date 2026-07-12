import { Request, Response } from 'express';
import { CollectionService, CollectionConflictError, CollectionNotFoundError } from '../services/collection.service';
import { createCollectionSchema, updateCollectionSchema } from '../validators/collection.schema';
import { z } from 'zod';

const collectionService = new CollectionService();

export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createCollectionSchema.parse(req.body);
    const collection = await collectionService.create(data);
    res.status(201).json({ success: true, data: collection });
  } catch (error: any) {
    if (error instanceof z.ZodError || error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    if (error instanceof CollectionConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    console.error('Error creating collection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const collections = await collectionService.findAll();
    res.status(200).json({ success: true, data: collections });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const collection = await collectionService.findById(id);
    res.status(200).json({ success: true, data: collection });
  } catch (error: any) {
    if (error instanceof CollectionNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching collection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateCollectionSchema.parse(req.body);
    const collection = await collectionService.update(id, data);
    res.status(200).json({ success: true, data: collection });
  } catch (error: any) {
    if (error instanceof z.ZodError || error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    if (error instanceof CollectionNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof CollectionConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    console.error('Error updating collection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await collectionService.delete(id);
    res.status(200).json({ success: true, message: 'Collection deleted successfully' });
  } catch (error: any) {
    if (error instanceof CollectionNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    console.error('Error deleting collection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
