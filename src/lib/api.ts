export type CropRequest = {
    N: number;
    P: number;
    K: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
  };
  
  export type CropResponse = {
    crop: string;
    top3: { crop: string; prob: number }[];
  };
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  
  export async function predictCrop(payload: CropRequest): Promise<CropResponse> {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`API Error ${res.status}: ${msg}`);
    }
  
    return res.json();
  }
  