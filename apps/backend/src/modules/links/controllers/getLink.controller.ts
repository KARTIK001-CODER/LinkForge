import { Request, Response } from 'express';
import { GetLinkService } from '../services/getLink.service';

const getLinkService = new GetLinkService();

export const getLink = async (req: Request, res: Response) => {
  try {
    const alias = req.params.alias as string;
    
    if (!alias || !/^[a-zA-Z0-9-]+$/.test(alias)) {
      res.status(400).json({ success: false, message: 'Invalid alias format' });
      return;
    }

    const data = await getLinkService.execute(alias);
    
    if (!data) {
      res.status(404).json({ success: false, message: 'Link not found' });
      return;
    }

    // Verify ownership
    if (data.userId !== (req as any).user?.id) {
      res.status(404).json({ success: false, message: 'Link not found' });
      return;
    }

    if (data.status === 'DELETED') {
      res.status(410).json({ success: false, message: 'This link is no longer available' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching link details:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
