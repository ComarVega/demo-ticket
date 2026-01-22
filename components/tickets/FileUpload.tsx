"use client"

import { useUploadThing } from "@/utils/uploadthing"
import { File, X, Image, FileText, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"

interface FileUploadProps {
  files: Array<{ name: string; url: string; size: number; type?: string }>
  onFilesChange: (files: Array<{ name: string; url: string; size: number; type?: string }>) => void
  disabled?: boolean
}

export function FileUpload({ files, onFilesChange, disabled = false }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hook de UploadThing
  const { startUpload, isUploading } = useUploadThing("fileUploader", {
    onClientUploadComplete: (res) => {
      if (res) {
        const uploadedFiles = res.map(file => ({
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type
        }))
        onFilesChange([...files, ...uploadedFiles])
      }
      setUploading(false)
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error)
      alert(`Error al subir archivo: ${error.message}`)
      setUploading(false)
    },
  })

  const handleFileUpload = async (filesToUpload: FileList) => {
    setUploading(true)
    const fileArray = Array.from(filesToUpload)
    await startUpload(fileArray)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-blue-600 flex-shrink-0" />
    }
    return <FileText className="w-5 h-5 text-slate-600 flex-shrink-0" />
  }

  return (
    <div className="space-y-4">
      {!disabled && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-slate-300 hover:border-blue-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.log"
            className="hidden"
            disabled={uploading || isUploading}
          />
          
          {(uploading || isUploading) ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-blue-600 mb-3 animate-spin" />
              <p className="text-sm font-medium text-slate-700">Subiendo archivos...</p>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => inputRef.current?.click()}>
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, PDF, DOC, TXT, LOG (máx. 8MB por archivo)
              </p>
            </div>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Archivos adjuntos ({files.length})
          </p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {file.url && (
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver
                </a>
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}