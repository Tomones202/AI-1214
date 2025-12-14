
import { AspectRatio, VideoMode, ImageResolution } from './types';

// Using Gemini 3.0 Pro for high-level reasoning/analysis
export const GEMINI_MODEL_ANALYSIS = 'gemini-3-pro-preview';

// Fallback model with higher quotas/rate limits (Gemini 2.5 Flash)
export const GEMINI_MODEL_ANALYSIS_FALLBACK = 'gemini-2.5-flash';

// Using Gemini 3.0 Pro Image (Banana Pro equivalent) for high quality assets
export const GEMINI_MODEL_IMAGE = 'gemini-3-pro-image-preview'; 

// Fallback Image Model (Flash Image)
export const GEMINI_MODEL_IMAGE_FALLBACK = 'gemini-2.5-flash-image';

// TTS Model
export const GEMINI_MODEL_TTS = 'gemini-2.5-flash-preview-tts';

export const PLATFORMS = [
    // Global Platforms (Requires Country Selection)
    { value: 'tiktok', label: 'TikTok (国际版抖音)', scope: 'global' },
    { value: 'temu', label: 'Temu (拼多多海外)', scope: 'global' },
    { value: 'amazon', label: 'Amazon (亚马逊)', scope: 'global' },
    { value: 'aliexpress', label: 'AliExpress (速卖通)', scope: 'global' },
    // Domestic Platforms (China Only)
    { value: 'douyin', label: 'Douyin (国内抖音)', scope: 'domestic' },
    { value: 'taobao', label: 'Taobao (淘宝)', scope: 'domestic' },
    { value: 'jd', label: 'JD.com (京东)', scope: 'domestic' },
    { value: 'pdd', label: 'Pinduoduo (拼多多)', scope: 'domestic' },
];

export const TARGET_MARKETS = [
  { value: 'US', label: 'United States (美国)', language: 'English', culture: 'Western, diverse American style' },
  { value: 'UK', label: 'United Kingdom (英国)', language: 'English', culture: 'Western, British style' },
  { value: 'TH', label: 'Thailand (泰国)', language: 'Thai', culture: 'Thai ethnicity, Southeast Asian style, dramatic storytelling' },
  { value: 'MY', label: 'Malaysia (马来西亚)', language: 'Malay', culture: 'Malay/Chinese/Indian mix, Southeast Asian style' },
  { value: 'VN', label: 'Vietnam (越南)', language: 'Vietnamese', culture: 'Vietnamese ethnicity, Southeast Asian style' },
  { value: 'ID', label: 'Indonesia (印尼)', language: 'Indonesian', culture: 'Indonesian ethnicity, Southeast Asian style' },
  { value: 'PH', label: 'Philippines (菲律宾)', language: 'Tagalog/English', culture: 'Filipino ethnicity, Southeast Asian style' },
  { value: 'JP', label: 'Japan (日本)', language: 'Japanese', culture: 'Japanese ethnicity, modern Japanese style, clean aesthetic' },
  { value: 'KR', label: 'South Korea (韩国)', language: 'Korean', culture: 'Korean ethnicity, modern Korean style, high fashion' },
  { value: 'DE', label: 'Germany (德国)', language: 'German', culture: 'German/European ethnicity, functional aesthetic' },
  { value: 'FR', label: 'France (法国)', language: 'French', culture: 'French/European ethnicity, artistic aesthetic' },
  // Internal use only for Domestic platforms
  { value: 'CN', label: 'China (中国)', language: 'Chinese (Mandarin)', culture: 'Chinese ethnicity, modern Chinese e-commerce style' },
];

export const ASPECT_RATIOS = [
  { value: AspectRatio.Ratio_9_16, label: '9:16 (竖屏通用)' },
  { value: AspectRatio.Ratio_16_9, label: '16:9 (横屏通用)' },
  { value: AspectRatio.Ratio_1_1, label: '1:1 (正方形)' },
  { value: AspectRatio.Ratio_3_4, label: '3:4 (肖像)' },
  { value: AspectRatio.Ratio_4_3, label: '4:3 (传统)' },
];

export const IMAGE_RESOLUTIONS = [
  { value: ImageResolution.Res_1K, label: '1K (标准)' },
  { value: ImageResolution.Res_2K, label: '2K (高清 - 推荐)' },
  { value: ImageResolution.Res_4K, label: '4K (超清)' },
];

export const VIDEO_MODES = [
  { value: VideoMode.Standard, label: '首帧图 (仅生成首图)' },
  { value: VideoMode.StartEnd, label: '连贯模式 (首图+尾图)' },
  { value: VideoMode.Intermediate, label: '运镜控制模式 (首图+草稿+尾图)' },
];

export const VOICE_OPTIONS = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'];
