interface RequestLogData {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

interface ResponseLogData {
  status: number;
  body: any;
}

export const logRequest = async (
  requestData: RequestLogData,
  apiCall: () => Promise<Response>
): Promise<Response> => {
  console.log('\n🌐 API Request:', {
    method: requestData.method || 'GET',
    url: requestData.url,
    headers: requestData.headers,
    body: requestData.body,
  });

  const startTime = Date.now();
  const response = await apiCall();
  const endTime = Date.now();

  const responseData: ResponseLogData = {
    status: response.status,
    body: await response.clone().json().catch(() => null),
  };

  console.log('✨ API Response:', {
    status: responseData.status,
    time: `${endTime - startTime}ms`,
    body: responseData.body,
  });

  return response;
}; 