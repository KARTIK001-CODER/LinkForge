import { Request, Response } from 'express';
import { GetLinksService } from '../services/getLinks.service';
import { getLinksSchema } from '../validators/getLinks.schema';
import { handleControllerError } from '../../../lib/error-handler';

const getLinksService = new GetLinksService();

export const getLinks = async (req: Request, res: Response) => {
  try {
    const query = getLinksSchema.parse(req.query);
    const data = await getLinksService.execute(query, req.user?.userId);
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    handleControllerError(res, error, 'Get Links');
  }
};
