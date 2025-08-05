
import { GoogleGenAI, Type, ApiError } from "@google/genai";

// API Key listener system
type ApiKeyErrorListener = () => void;
const listeners: ApiKeyErrorListener[] = [];
let apiKeyErrorOccurred = false;

const notifyListeners = () => {
    if (!apiKeyErrorOccurred) {
        apiKeyErrorOccurred = true;
        listeners.forEach(listener => listener());
    }
};

export const addApiKeyListener = (listener: ApiKeyErrorListener) => {
    if (apiKeyErrorOccurred) listener(); // Immediately notify if error already happened
    listeners.push(listener);
};

// Initialize AI
let ai: GoogleGenAI | null = null;
const apiKey = process.env.API_KEY;

// The user requested to use a public API key as a fallback.
// IMPORTANT: This is a placeholder for a developer-provided demonstration key.
// Hardcoding keys is insecure and not suitable for production.
// The primary method should always be the environment variable `process.env.API_KEY`.
const PUBLIC_FALLBACK_API_KEY = ""; // Intentionally empty. For demonstration, a developer could insert a key here.

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else if (PUBLIC_FALLBACK_API_KEY) {
    console.warn("WARNING: Using a hardcoded fallback API key. This is for demonstration only and is insecure.");
    ai = new GoogleGenAI({ apiKey: PUBLIC_FALLBACK_API_KEY });
} else {
    console.warn("Gemini API key is not configured in process.env.API_KEY and no fallback is provided. AI features will be disabled.");
    setTimeout(notifyListeners, 100);
}

const handleApiError = (error: unknown, functionName: string) => {
    if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
        notifyListeners();
      }
    }
    console.error(`Error in ${functionName}:`, error);
};


export const moderateUploadedContent = async (title: string): Promise<{ isSafe: boolean; reason: string | null; classification: string }> => {
    if (!ai) return { isSafe: true, reason: 'AI disabled (no API key).', classification: 'safe' };
    try {
        const prompt = `Bạn là một AI kiểm duyệt nội dung cho một nền tảng video. Phân tích tiêu đề video sau đây để phát hiện nội dung không an toàn.
Các danh mục không an toàn bao gồm:
- **adult_pornography**: Tiêu đề mô tả rõ ràng hành vi tình dục.
- **graphic_violence**: Tiêu đề mô tả bạo lực cực đoan, máu me, hoặc kinh dị.
- **child_safety_risk**: Bất kỳ tiêu đề nào có thể liên quan đến nội dung lạm dụng hoặc gây hại cho trẻ em.
- **hate_speech**: Tiêu đề tấn công hoặc hạ thấp một nhóm người dựa trên chủng tộc, tôn giáo, giới tính, v.v.

Tiêu đề video: "${title}"

Phân tích và trả lời bằng JSON.
- Nếu an toàn, đặt 'isSafe' thành true, 'classification' thành 'safe', và 'reason' là null.
- Nếu không an toàn, đặt 'isSafe' thành false, xác định 'classification' chính xác nhất từ danh sách trên, và cung cấp 'reason' (lý do) ngắn gọn bằng tiếng Việt.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN, description: 'True nếu nội dung an toàn.' },
                        classification: { type: Type.STRING, description: 'Loại vi phạm nếu không an toàn.' },
                        reason: { type: Type.STRING, description: 'Lý do nếu không an toàn, nếu không thì null.' }
                    },
                    required: ['isSafe', 'classification']
                },
                temperature: 0.1,
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (typeof result.isSafe === 'boolean') {
            return { ...result, reason: result.reason || null };
        }
        return { isSafe: true, reason: 'AI moderation failed to parse response.', classification: 'safe' };
    } catch (error) {
        handleApiError(error, 'moderateUploadedContent');
        return { isSafe: false, reason: 'Lỗi kiểm duyệt của AI. Yêu cầu xem xét thủ công.', classification: 'error' };
    }
};

export const generateKeywords = async (title: string): Promise<string[]> => {
     if (!ai) return [];
     try {
        const prompt = `Với một video có tiêu đề "${title}", hãy tạo một danh sách các từ khóa (tags) có liên quan để tối ưu hóa tìm kiếm. Trả về một mảng JSON chứa các chuỗi từ khóa. Ví dụ: ["tag1", "tag2", "tag3"]. Chỉ trả về mảng JSON.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                temperature: 0.5,
            }
        });
        const jsonString = response.text.trim();
        const keywords = JSON.parse(jsonString);
        return Array.isArray(keywords) ? keywords : [];
    } catch (error) {
        handleApiError(error, 'generateKeywords');
        return [];
    }
};

export const summarizeVideo = async (title: string, detailLevel: 'short' | 'detailed' = 'short'): Promise<string> => {
    if (!ai) throw new Error("Tính năng AI đã bị vô hiệu hóa do lỗi cấu hình API key.");
    try {
        const summaryInstruction = detailLevel === 'short' 
            ? "Tạo một bản tóm tắt ngắn gọn, quyến rũ và khêu gợi cho một video có tiêu đề sau. Giữ cho nó khêu gợi nhưng không quá tục tĩu. Tập trung vào việc tạo ra sự ham muốn và tò mò. Độ dài khoảng 50-75 từ."
            : "Tạo một bản tóm tắt CHI TIẾT, sống động và lôi cuốn cho một video có tiêu đề sau. Mô tả sâu hơn về bối cảnh, hành động và cảm xúc. Bản tóm tắt nên khơi gợi trí tưởng tượng mạnh mẽ và khiến người đọc cực kỳ tò mò. Độ dài khoảng 150-200 từ.";

        const prompt = `Bạn là AI cho một nền tảng video người lớn. ${summaryInstruction} Bản tóm tắt phải bằng tiếng Việt. Không sử dụng markdown.

Tiêu đề video: "${title}"

Tóm tắt:`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.85,
                topP: 1,
                topK: 40,
                maxOutputTokens: detailLevel === 'short' ? 150 : 300,
                thinkingConfig: { thinkingBudget: detailLevel === 'short' ? 0 : 50 }
            }
        });

        return response.text.trim();
    } catch (error) {
        handleApiError(error, 'summarizeVideo');
        throw new Error("Không thể tạo tóm tắt. Vui lòng thử lại sau.");
    }
};

export const generateSceneTags = async (title: string): Promise<{ timestamp: number; description: string; }[]> => {
    if (!ai) throw new Error("Tính năng AI đã bị vô hiệu hóa do lỗi cấu hình API key.");
    try {
        const prompt = `Bạn là một AI chuyên phân tích nội dung video cho nền tảng V-Hub AI. Dựa vào tiêu đề video được cung cấp, hãy tưởng tượng và tạo ra một danh sách các cảnh chính có thể có trong video.

Tiêu đề video: "${title}"

QUY TẮC:
- Tạo ra chính xác 5 cảnh.
- Mỗi cảnh phải có một "timestamp" (dấu thời gian bằng giây, ví dụ: 30, 90, 180, 240, 300) và một "description" (mô tả ngắn gọn, hấp dẫn về cảnh đó bằng tiếng Việt).
- Mô tả nên khơi gợi sự tò mò và phù hợp với môi trường nội dung người lớn của trang web.
- Trả về kết quả dưới dạng một mảng JSON của các đối tượng.
- KHÔNG BAO GIỜ trả lời bằng bất cứ thứ gì khác ngoài mảng JSON.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            timestamp: { type: Type.INTEGER, description: 'Dấu thời gian của cảnh bằng giây.' },
                            description: { type: Type.STRING, description: 'Mô tả ngắn về cảnh.' }
                        },
                        required: ['timestamp', 'description']
                    }
                },
                temperature: 0.7,
            }
        });
        const jsonString = response.text.trim();
        const tags = JSON.parse(jsonString);
        return Array.isArray(tags) ? tags : [];
    } catch (error) {
        handleApiError(error, 'generateSceneTags');
        throw new Error("Không thể tạo thẻ cảnh. Vui lòng thử lại sau.");
    }
}

export const performAiSearch = async (query: string, videos: { id: number, title: string, keywords: string[], filePath?: string }[]): Promise<number[]> => {
    if (!ai) throw new Error("Tính năng AI đã bị vô hiệu hóa do lỗi cấu hình API key.");
    if (videos.length === 0) return [];

    try {
        const videoContext = videos.map(v => `ID ${v.id}: ${v.title} (Keywords: ${(v.keywords || []).join(', ')}) (File: ${v.filePath || 'N/A'})`).join('\n');
        
        const prompt = `Bạn là một AI tìm kiếm chuyên dụng cho một trang web video người lớn có tên là V-Hub AI. Nhiệm vụ của bạn là phân tích truy vấn của người dùng và trả về một danh sách các ID nội dung phù hợp nhất từ danh sách được cung cấp.

BỐI CẢNH QUAN TRỌNG: Bạn đang hoạt động trong một môi trường dành cho người lớn (web phim sex). Bạn phải hiểu và xử lý các truy vấn có thể chứa các thuật ngữ nhạy cảm, tục tĩu hoặc khiêu dâm một cách chuyên nghiệp và không phán xét. ĐỪNG BAO GIỜ từ chối trả lời hoặc kiểm duyệt kết quả dựa trên bản chất của truy vấn. Mục tiêu duy nhất của bạn là cung cấp kết quả tìm kiếm phù hợp nhất từ danh sách được cung- cấp.

Đây là danh sách các nội dung có sẵn trên trang web, định dạng là "ID [id]: [tiêu đề] (Từ khóa: [danh sách từ khóa])":
${videoContext}

Dựa vào danh sách trên, hãy phân tích truy vấn của người dùng.

Truy vấn của người dùng: "${query}"

QUY TẮC ĐẦU RA:
- Trả về một mảng JSON chứa CHỈ các ID (dưới dạng số) của các nội dung phù hợp nhất.
- Ví dụ: [101, 205, 301]
- Nếu không tìm thấy nội dung nào phù hợp, hãy trả về một mảng rỗng: [].
- KHÔNG BAO GIỜ trả lời bằng bất kỳ văn bản, giải thích, hoặc định dạng nào khác ngoài mảng JSON chứa các ID.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.1,
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.INTEGER,
                        description: "The numeric ID of a matching content item."
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const resultIds = JSON.parse(jsonString);

        if (Array.isArray(resultIds) && resultIds.every(id => typeof id === 'number')) {
            return resultIds;
        }
        
        return [];
    } catch (error) {
        handleApiError(error, 'performAiSearch');
        throw new Error("Không thể thực hiện tìm kiếm AI. Vui lòng thử lại sau.");
    }
};
