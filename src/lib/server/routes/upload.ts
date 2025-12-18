import type { SuccessApiResponse } from '$/types/types';
import { AnyFormDataInput, type ErrorApiResponse } from '@patrick115/sveltekitapi';
import { tokenProcedure } from '../api';
import { uploadFile } from '../functions';

export default tokenProcedure.POST.input(AnyFormDataInput).query(async ({ ctx, input }) => {
    const uploaded = await uploadFile(input, ctx.id);

    if (!uploaded) {
        return {
            status: false,
            code: 400,
            message: 'No file uploaded'
        } satisfies ErrorApiResponse;
    }

    return {
        status: true,
        data: uploaded.path
    } satisfies SuccessApiResponse<string>;
});
