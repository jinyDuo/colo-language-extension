import axios from 'axios';
import { normalizeAndValidateUrl } from '../../shared/http-url/utils/urlHelper';
import { handleApiError } from './errorHandler';

export const fetchDictionaryData = async (url: string): Promise<string> => {
	const validUrl = normalizeAndValidateUrl(url);

	try {
		const response = await axios.get(validUrl);
		return response.data;
	} catch (error) {
		throw handleApiError(error);
	}
};
