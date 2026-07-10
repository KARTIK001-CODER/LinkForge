import { Request, Response } from 'express';
import { GetLinksService } from '../services/getLinks.service';
import { getLinksSchema } from '../validators/getLinks.schema';

const getLinksService = new GetLinksService();

export const getLinks = async (req: Request, res: Response) => {
  try {
    const query = getLinksSchema.parse(req.query);
    const data = await getLinksService.execute(query);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, errors: error.errors });
      return;
    }
    console.error('Error fetching links:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
