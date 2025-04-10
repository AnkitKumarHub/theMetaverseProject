import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../quill.css';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase';

// Use forwardRef to properly handle refs with ReactQuill
const QuillEditor = forwardRef(({ value, onChange, placeholder, onBlur }, ref) => {
  const [editorValue, setEditorValue] = useState(value || '');
  
  // Handle focus problems with this effect
  useEffect(() => {
    if (value !== editorValue) {
      setEditorValue(value || '');
    }
  }, [value]);

  // Properly handle changes to maintain cursor position
  const handleChange = (content) => {
    setEditorValue(content);
    onChange(content);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean'],
      ['code-block', 'blockquote'],
      [{ 'align': [] }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'font': [] }]
    ]
  };
  
  return (
    <div className="standalone-editor" style={{ height: 'auto', minHeight: '200px' }}>
      <ReactQuill
        ref={ref}
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        onBlur={onBlur}
        modules={modules}
        placeholder={placeholder || "Write your description here"}
        preserveWhitespace={true}
        style={{ height: 'auto' }}
      />
    </div>
  );
});

// Add a display name to the component
QuillEditor.displayName = 'QuillEditor';

// Add this CSS style after imports to fix the editor's scrollbar issue
const quillFixStyle = `
.standalone-editor {
  display: flex;
  flex-direction: column;
}

.standalone-editor .quill {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.standalone-editor .quill .ql-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.standalone-editor .quill .ql-editor {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}
`;

const ArticleModal = ({ isOpen, onClose }) => {
  const [previewImage, setPreviewImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const editorRef = useRef(null);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      date: currentDate,
      title: '',
      slug: '',
      metaTitle: '',
      subtitle: '',
      imageUrl: '',
      description: '',
      metaDescription: '',
      author: '',
      faqs: [{ question: '', answer: '' }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs"
  });
  
  // Watch fields for reactive updates
  const title = watch('title');
  const imageUrl = watch('imageUrl');
  
  // Generate slug from title
  useEffect(() => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      setValue('slug', slug);
    }
  }, [title, setValue]);
  
  // Update preview image when imageUrl changes
  useEffect(() => {
    // Clear preview if imageUrl is cleared
    if (!imageUrl) {
      setPreviewImage('');
    } 
    // Set preview if imageUrl is a valid URL (not the uploading message)
    else if (imageUrl !== 'Uploading image...' && !previewImage) {
      setPreviewImage(imageUrl);
    }
  }, [imageUrl, previewImage]);
  
  // Handle main image file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
    
    // Start upload
    setIsUploading(true);
    setValue('imageUrl', 'Uploading image...');
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After "upload", update with a permanent URL
      const uploadedUrl = `https://source.unsplash.com/random/800x600?sig=${Math.random()}`;
      setValue('imageUrl', uploadedUrl);
      setIsUploading(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setValue('imageUrl', ''); // Clear on error
      setPreviewImage(''); // Clear preview on error
      alert('Image upload failed. Please try again.');
    }
  };
  
  // Trigger the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Image handler for Quill editor
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          // Insert a placeholder
          const range = quillRef.current.getEditor().getSelection();
          quillRef.current.getEditor().insertText(range.index, 'Uploading image...', 'bold', true);
          
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get random image URL (in a real app, this would be your server response)
          const uploadedUrl = `https://source.unsplash.com/random/800x600?sig=${Math.random()}`;
          
          // Remove placeholder and insert image
          quillRef.current.getEditor().deleteText(range.index, 'Uploading image...'.length);
          quillRef.current.getEditor().insertEmbed(range.index, 'image', uploadedUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        }
      }
    };
  };
  
  // Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ 'direction': 'rtl' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'font': [] }],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  };
  
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align', 'direction',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'clean', 'script'
  ];
  
  // Get current user from AuthContext
  const { currentUser } = useAuth();
  
  // Modified onSubmit function
  const onSubmit = async (data) => {
    try {
      // Check if user is logged in
      if (!currentUser) {
        alert('You must be logged in to publish an article');
        return;
      }
      
      setIsUploading(true);
      
      // Prepare article data
      const articleData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        metaDescription: data.metaDescription || '',
        imageUrl: data.imageUrl,
        createdAt: serverTimestamp(),
        author: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '',
        },
        date: data.date,
        subtitle: data.subtitle || '',
        faqs: data.faqs || [],
        metaTitle: data.metaTitle || '',
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'articles'), articleData);
      
      console.log('Article published with ID:', docRef.id);
      alert('Article published successfully!');
      setIsUploading(false);
      onClose();
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Error publishing article: ' + error.message);
      setIsUploading(false);
    }
  };
  
  // If the modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center pt-10 pb-20">
      <style>{quillFixStyle}</style>
      <div className="bg-white rounded-2xl w-full max-w-5xl mx-4 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Add New Article</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Improved Date Field UI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{formattedDate}</span>
                  <input
                    type="hidden"
                    {...register("date")}
                    defaultValue={currentDate}
                  />
                </div>
              </div>
              
              {/* Author Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <select
                  {...register("author", { required: "Author is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Author</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Alex Johnson">Alex Johnson</option>
                </select>
                {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
              </div>
            </div>
            
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                {...register("title", { 
                  required: "Title is required",
                  maxLength: { value: 100, message: "Title cannot be more than 100 characters" }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Article title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>
            
            {/* Split Slug Field with Base URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Article URL</label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  www.Themetaversejounal.com/article/
                </span>
                <input
                  type="text"
                  {...register("slug", { required: "Slug is required" })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-article-slug"
                />
              </div>
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
              <p className="mt-1 text-xs text-gray-500">This URL is automatically generated from the title but can be edited</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meta Title Field with increased character limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Title (SEO)
                  <span className="text-xs text-gray-500 ml-1">Max 500 chars</span>
                </label>
                <input
                  type="text"
                  {...register("metaTitle", { 
                    maxLength: { value: 500, message: "Meta title cannot be more than 500 characters" }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO optimized title"
                />
                {errors.metaTitle && <p className="mt-1 text-sm text-red-600">{errors.metaTitle.message}</p>}
                <div className="mt-1 text-xs text-gray-500">
                  Characters: {watch("metaTitle")?.length || 0}/500
                </div>
              </div>
              
              {/* Subtitle Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  {...register("subtitle")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Article subtitle"
                />
              </div>
            </div>
            
            {/* Image Upload Field - Fixed clearing issue */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="text"
                  {...register("imageUrl")}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                  onChange={(e) => {
                    const url = e.target.value;
                    setValue('imageUrl', url);
                    // If URL is cleared, clear the preview
                    if (!url) {
                      setPreviewImage('');
                    } else {
                      setPreviewImage(url);
                    }
                  }}
                />
                <span className="text-gray-500">or</span>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${isUploading ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Browse
                    </div>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
              <p className="text-xs text-gray-500 mb-2">Upload a high-quality image (JPG, PNG, WebP) for best results. Recommended size: 1200×630px.</p>
              
              {/* Image Preview - Only show when there's an image */}
              {previewImage && (
                <div className="mt-2 relative w-full h-60 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/640x360?text=Image+Not+Found';
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Description Editor with rich text formatting */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="border border-gray-300 rounded-md overflow-hidden" style={{ minHeight: '250px' }}>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <QuillEditor
                      ref={editorRef}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            {/* Meta Description field with consistent styling */}
            <div className="mb-6 mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (for SEO):</label>
              <Controller
                name="metaDescription"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
                    rows={4}
                    placeholder="SEO description for search results"
                  />
                )}
              />
              <div className="mt-1 text-xs text-gray-500">
                Characters: {watch("metaDescription")?.length || 0}/160
              </div>
            </div>
            
            {/* FAQ Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">FAQs (Optional)</label>
                <button
                  type="button"
                  onClick={() => append({ question: '', answer: '' })}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add FAQ
                </button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-md mb-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">FAQ #{index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <input
                      {...register(`faqs.${index}.question`)}
                      placeholder="Question"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <textarea
                      {...register(`faqs.${index}.answer`)}
                      placeholder="Answer"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
                    ></textarea>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit((data) => {
                  console.log({ ...data, status: 'draft' });
                  alert('Article saved as draft');
                  onClose();
                })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Publish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal; 