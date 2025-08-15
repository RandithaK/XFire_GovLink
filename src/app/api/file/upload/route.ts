import { NextRequest, NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderPath = formData.get("folderPath") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `${timestamp}-${originalName}`;

    // Upload to R2
    const uploadResult = await uploadFileToR2(
      fileBuffer,
      fileName,
      file.type,
      folderPath || undefined
    );

    if (uploadResult.success && uploadResult.key) {
      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
        url: uploadResult.key, // Using key as the URL/identifier
        data: {
          url: uploadResult.key, // R2 object key
          fileName: fileName,
          originalName: originalName,
          mimeType: file.type,
          size: file.size,
          folderPath: folderPath || null,
          uploadedAt: new Date().toISOString()
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: uploadResult.message,
        error: uploadResult.error
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Upload endpoint error:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}