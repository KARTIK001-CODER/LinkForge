export interface Collection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    links: number;
  };
}

export interface GetCollectionsResponse {
  success: boolean;
  data: Collection[];
}

export interface GetCollectionResponse {
  success: boolean;
  data: Collection;
}
