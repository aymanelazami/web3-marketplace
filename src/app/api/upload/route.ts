import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/upload - Upload file (images, digital products)
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'image'; // image, product

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (10MB max for images, 100MB for products)
        const maxSize = type === 'product' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `File too large. Max ${type === 'product' ? '100MB' : '10MB'}`
            }, { status: 400 });
        }

        // Validate file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedProductTypes = [...allowedImageTypes, 'application/pdf', 'application/zip', 'application/x-zip-compressed'];

        const allowedTypes = type === 'product' ? allowedProductTypes : allowedImageTypes;
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type'
            }, { status: 400 });
        }

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return public URL
        const url = `/uploads/${type}/${filename}`;

        return NextResponse.json({
            url,
            filename,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
