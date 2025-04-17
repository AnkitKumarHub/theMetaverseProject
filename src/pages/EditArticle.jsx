import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../../firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReactQuill from 'react-quill';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import 'react-quill/dist/quill.snow.css';
import '../quill.css';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// Update the QuillEditor component to be more stable
const QuillEditor = React.forwardRef(({ value, onChange, placeholder, onBlur }, ref) => {
  const [initialized, setInitialized] = useState(false);
  const localQuillRef = useRef(null);
  
  useEffect(() => {
    setInitialized(true);
    return () => setInitialized(false);
  }, []);

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
  
  React.useImperativeHandle(ref, () => ({
    getEditor: () => localQuillRef.current?.getEditor()
  }));

  if (!initialized) {
    return <div className="loading-editor">Loading editor...</div>;
  }
  
  return (
    <div className="standalone-editor">
      <ReactQuill
        ref={localQuillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        modules={modules}
        placeholder={placeholder || "Write your content here"}
        preserveWhitespace={true}
        className="editor-container"
      />
    </div>
  );
});

// Add a display name to the component
QuillEditor.displayName = 'QuillEditor';

// Add custom styles for the editor
const quillFixStyle = `
  .standalone-editor {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 0.5rem;
    height: 800px !important; /* Fixed height for the entire container */
  }

  .standalone-editor .quill {
    display: flex;
    flex-direction: column;
    height: 100% !important;
  }

  .standalone-editor .quill .ql-container {
    flex: 1;
    height: auto !important;
    font-size: 16px;
    line-height: 1.6;
  }

  .standalone-editor .quill .ql-editor {
    height: calc(100% - 42px) !important; /* Subtract toolbar height */
    min-height: unset !important;
    max-height: unset !important;
    overflow-y: auto;
    padding: 2rem;
    font-family: 'Inter', sans-serif;
  }

  .standalone-editor .ql-toolbar.ql-snow {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding: 0.75rem;
    background: #f9fafb;
    height: 42px; /* Fixed height for toolbar */
  }

  .standalone-editor .ql-container.ql-snow {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    height: calc(100% - 42px) !important; /* Subtract toolbar height */
  }

  .editor-container {
    height: 100% !important;
    display: flex;
    flex-direction: column;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .ql-toolbar button {
    width: 28px;
    height: 28px;
    padding: 0.375rem !important;
    margin: 0 0.125rem !important;
    border-radius: 0.375rem !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ql-toolbar button:hover {
    background-color: #f3f4f6 !important;
  }

  .ql-formats {
    margin-right: 1rem !important;
    display: inline-flex;
    align-items: center;
  }

  .ql-editor p {
    margin-bottom: 1rem;
  }

  .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
    margin: 1.5rem 0 1rem;
    font-weight: 600;
  }

  /* Font selector styles */
  .ql-snow .ql-picker.ql-font,
  .ql-snow .ql-picker.ql-size {
    width: 100px !important;
  }

  /* Dropdown menu styles */
  .ql-snow .ql-picker-options {
    border-radius: 0.375rem !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  }
`;

const EditArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const [formDirty, setFormDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [articleStatus, setArticleStatus] = useState('published');
  const [deleting, setDeleting] = useState(false);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      metaTitle: '',
      subtitle: '',
      metaDescription: '',
      metaTags: '',
      content: '',
      imageUrl: '',
      date: '',
      author: '',
      tags: [],
      faqs: [{ question: '', answer: '' }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs"
  });

  const title = watch('title');
  const imageUrl = watch('imageUrl');
  const tags = watch('tags') || [];
  
  useEffect(() => {
    if (isDirty) {
      setFormDirty(true);
    }
  }, [isDirty]);

  useEffect(() => {
    if (title) {
      const newSlug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', newSlug);
    }
  }, [title, setValue]);

  useEffect(() => {
    if (article?.content) {
      setValue('content', article.content);
    }
  }, [article, setValue]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Article not found");
          setLoading(false);
          return;
        }

        const articleData = docSnap.data();
        
        if (articleData.userId !== user.uid) {
          setError("You don't have permission to edit this article");
          setLoading(false);
          return;
        }

        setArticle(articleData);
        
        setArticleStatus(articleData.status || 'published');
        
        setValue('title', articleData.title || '');
        setValue('slug', articleData.slug || '');
        setValue('metaTitle', articleData.metaTitle || '');
        setValue('subtitle', articleData.subtitle || '');
        setValue('metaDescription', articleData.metaDescription || '');
        setValue('metaTags', articleData.metaTags || '');
        setValue('content', articleData.content || articleData.description || '');
        setValue('imageUrl', articleData.imageUrl || '');
        setValue('date', articleData.createdAt ? new Date(articleData.createdAt.toDate()).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '');
        
        if (articleData.tags && Array.isArray(articleData.tags)) {
          setValue('tags', articleData.tags);
        }
        
        if (articleData.userId) {
          const userDocRef = doc(db, 'users', articleData.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setValue('author', `${userData.firstname} ${userData.lastname || ''}`.trim() || userData.email);
          }
        }
        
        if (articleData.faqs && articleData.faqs.length > 0) {
          setValue('faqs', articleData.faqs);
        }
        
        setPreviewImage(articleData.imageUrl || '');
        setLoading(false);
        setFormDirty(false);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load the article. Please try again later.");
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate, setValue]);

  const handleTagAdd = (newTag) => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setValue('tags', [...tags, newTag.trim()]);
      return true;
    }
    return false;
  };

  const handleTagRemove = (tagToRemove) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setValue('imageUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const uploadImage = async () => {
    if (!imageFile) return imageUrl;

    setIsUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `article_images/${Date.now()}_${imageFile.name}`);
    
    const uploadTask = uploadBytesResumable(storageRef, imageFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          setIsUploading(false);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setValue('imageUrl', downloadURL);
          setIsUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          const editor = quillRef.current?.getEditor();
          if (!editor) {
            console.error("Editor not available");
            return;
          }
          
          const range = editor.getSelection();
          editor.insertText(range.index, 'Uploading image...', 'bold', true);
          
          const storage = getStorage();
          const storageRef = ref(storage, `article_content_images/${Date.now()}_${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Progress tracking if needed
            },
            (error) => {
              console.error("Upload failed:", error);
              editor.deleteText(range.index, 'Uploading image...'.length);
              toast.error('Failed to upload image. Please try again.');
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              editor.deleteText(range.index, 'Uploading image...'.length);
              editor.insertEmbed(range.index, 'image', downloadURL);
            }
          );
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image. Please try again.');
        }
      }
    };
  };

  const deleteArticle = async () => {
    try {
      setDeleting(true);
      
      const articleRef = doc(db, "articles", id);
      await deleteDoc(articleRef);
      
      toast.success('Article deleted successfully');
      
      navigate('/your-content', { state: { activeTab: 'published', fromEdit: true } });
    } catch (err) {
      console.error("Error deleting article:", err);
      toast.error("Failed to delete article. Please try again.");
      setDeleting(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const onSubmit = async (data) => {
    try {
      if (!data.title.trim()) {
        toast.error("Please enter a title for your article");
        return;
      }
      
      if (!data.content.trim()) {
        toast.error("Please add some content to your article");
        return;
      }
      
      if (!data.imageUrl && !imageFile && !previewImage) {
        toast.error("Please upload a featured image");
        return;
      }
      
      setSaving(true);
      
      let finalImageUrl = data.imageUrl;
      if (imageFile && !previewImage.startsWith('data:')) {
        finalImageUrl = await uploadImage();
      } else if (previewImage.startsWith('data:')) {
        finalImageUrl = previewImage;
      }
      
      let finalSlug = data.slug;
      if (!finalSlug) {
        finalSlug = data.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        setValue('slug', finalSlug);
      }
      
      const articleRef = doc(db, "articles", id);
      await updateDoc(articleRef, {
        title: data.title,
        slug: finalSlug,
        metaTitle: data.metaTitle || '',
        subtitle: data.subtitle || '',
        metaDescription: data.metaDescription,
        metaTags: data.metaTags || '',
        content: data.content,
        imageUrl: finalImageUrl,
        tags: data.tags || [],
        faqs: data.faqs || [],
        status: articleStatus,
        updatedAt: serverTimestamp()
      });
      
      if (articleStatus === 'published') {
        toast.success('Article published successfully!', {
          duration: 4000,
          position: 'top-right',
        });
      } else {
        toast.success('Draft saved successfully!', {
          duration: 4000,
          position: 'top-right',
        });
      }
      
      setSaving(false);
      setFormDirty(false);
      
      setTimeout(() => {
        if (articleStatus === 'published') {
          navigate(`/articles/${finalSlug}`, { state: { fromEdit: true } });
        } else {
          navigate('/your-content', { state: { activeTab: 'drafts', fromEdit: true } });
        }
      }, 1000);
      
    } catch (err) {
      console.error("Error saving article:", err);
      toast.error("Failed to save article. Please try again.", {
        duration: 4000,
        position: 'top-right',
      });
      setSaving(false);
    }
  };

  // Configure Quill modules
  const modules = {
    toolbar: {
      container: [
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['Inter',sans-serif]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white font-['Inter',sans-serif]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Error</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link 
              to="/your-content"
              className="inline-flex items-center px-5 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Your Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      <style>{quillFixStyle}</style>
      <Navbar />
      <Toaster position="top-right" />
      
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Delete Article</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this article? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteArticle}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showPreview ? (
        <main className="pt-32 pb-16">
          <motion.div
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Article Preview</h1>
              <div className="flex space-x-3">
                <button
                  onClick={togglePreview}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Editor
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {previewImage && (
                <div className="w-full h-[400px]">
                  <img 
                    src={previewImage} 
                    alt={watch('title')} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{watch('title')}</h1>
                  {watch('subtitle') && (
                    <h2 className="text-xl text-gray-600 mb-4">{watch('subtitle')}</h2>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <span className="mr-4">By {watch('author')}</span>
                    <span>{watch('date')}</span>
                  </div>
                  
                  {watch('metaTags') && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {watch('metaTags').split(',').map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: watch('content') || '<p>No content yet</p>' }}></div>
                </div>
                
                {fields.length > 0 && fields[0].question && (
                  <div className="mt-8 border-t border-gray-100 pt-8">
                    <h3 className="text-xl font-semibold mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                      {fields.map((field, index) => {
                        const question = watch(`faqs.${index}.question`);
                        const answer = watch(`faqs.${index}.answer`);
                        if (!question) return null;
                        
                        return (
                          <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-lg font-medium mb-2">{question}</h4>
                            <p className="text-gray-700">{answer}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      ) : (
        <main className="pt-32 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link to="/" className="text-gray-500 hover:text-gray-700">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <Link to="/your-content" className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">Your Content</Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="ml-2 text-sm font-medium text-gray-700" aria-current="page">Edit Article</span>
                  </div>
                </li>
              </ol>
            </nav>

            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
              <div className="flex items-center space-x-6">
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setArticleStatus('draft');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      articleStatus === 'draft' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArticleStatus('published');
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      articleStatus === 'published' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Published
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={togglePreview}
                    className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                    title="Preview Article"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete Article"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    type="button"
                    onClick={() => {
                      if (formDirty) {
                        if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                          navigate('/your-content');
                        }
                      } else {
                        navigate('/your-content');
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving || isUploading}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200
                      ${saving || isUploading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow'
                      }
                    `}
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{articleStatus === 'published' ? 'Publishing...' : 'Saving...'}</span>
                      </div>
                    ) : (
                      <span>{articleStatus === 'published' ? 'Publish' : 'Save Draft'}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {(saving || isUploading) && (
              <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-8 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Article Details</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
                        <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                          {watch('date')}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                        <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
                          {watch('author')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="title"
                        type="text"
                        {...register("title", { 
                          required: "Title is required",
                          maxLength: { value: 100, message: "Title cannot be more than 100 characters" }
                        })}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter a compelling title"
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                        <input
                          type="text"
                          {...register("subtitle")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Article subtitle"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Title (SEO)
                          <span className="text-xs text-gray-500 ml-1">Max 60 chars</span>
                        </label>
                        <input
                          type="text"
                          {...register("metaTitle", { 
                            maxLength: { value: 60, message: "Meta title cannot be more than 60 characters" }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="SEO optimized title"
                        />
                        {errors.metaTitle && <p className="mt-1 text-sm text-red-600">{errors.metaTitle.message}</p>}
                        <div className="mt-1 text-xs text-gray-500">
                          Characters: {watch("metaTitle")?.length || 0}/60
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                        Article URL <span className="text-red-500">*</span>
                      </label>
                      <div className="flex rounded-lg shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          www.Themetaversejounal.com/article/
                        </span>
                        <input
                          type="text"
                          id="slug"
                          {...register("slug", { required: "URL slug is required" })}
                          className="flex-1 block w-full rounded-none rounded-r-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 px-4 py-3 transition-colors"
                          placeholder="your-article-slug"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        This URL is automatically generated from the title but can be edited
                      </p>
                      {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                        <span className="text-xs text-gray-500 ml-1">Max 160 chars</span>
                      </label>
                      <textarea
                        id="metaDescription"
                        rows="3"
                        {...register("metaDescription", {
                          maxLength: { value: 160, message: "Meta description cannot be more than 160 characters" }
                        })}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Brief description for search engines (recommended: 150-160 characters)"
                      ></textarea>
                      <div className="mt-1 text-xs text-gray-500 flex justify-end">
                        {watch("metaDescription")?.length || 0}/160 characters
                      </div>
                      {errors.metaDescription && <p className="mt-1 text-sm text-red-600">{errors.metaDescription.message}</p>}
                    </div>

                    <div className="mt-4">
                      <label htmlFor="metaTags" className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Tags
                        <span className="text-xs text-gray-500 ml-1">Comma separated keywords</span>
                      </label>
                      <input
                        id="metaTags"
                        type="text"
                        {...register("metaTags")}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="metaverse, vr, blockchain, technology"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Add keywords separated by commas to improve SEO and discoverability
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Featured Image <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-3 mb-2">
                        <input
                          type="text"
                          {...register("imageUrl", {required: "Featured image is required"})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/image.jpg"
                          onChange={(e) => {
                            const url = e.target.value;
                            setValue('imageUrl', url);
                            if (!url) {
                              setPreviewImage('');
                            } else {
                              setPreviewImage(url);
                            }
                          }}
                        />
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
                              "Browse"
                          )}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Upload a high-quality image (JPG, PNG, WebP) for best results. Recommended size: 1200×630px.</p>
                      
                      {previewImage && (
                        <div className="mt-2 relative w-full h-48 bg-gray-50 rounded-md overflow-hidden border border-gray-200">
                          <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="w-full h-full object-contain" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/640x360?text=Image+Not+Found';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage('');
                              setImageFile(null);
                              setValue('imageUrl', '');
                            }}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Uploading: {Math.round(uploadProgress)}%</p>
                        </div>
                      )}
                      {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="p-8 border-t border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Article Content</h2>
                  
                  <div className="mb-12">
                    <div className="standalone-editor border border-gray-300 rounded-lg">
                      <Controller
                        name="content"
                        control={control}
                        rules={{ required: "Content is required" }}
                        render={({ field }) => (
                          <QuillEditor
                            ref={quillRef}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Write your article content here..."
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                    {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>}
                  </div>

                  <div className="space-y-6 pt-8 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">FAQs (Optional)</h3>
                      <button
                        type="button"
                        onClick={() => append({ question: '', answer: '' })}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add FAQ
                      </button>
                    </div>

                    <div className="space-y-4 mt-6">
                      {fields.map((field, index) => (
                        <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-gray-900">FAQ #{index + 1}</h4>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            <input
                              {...register(`faqs.${index}.question`)}
                              placeholder="Question"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <textarea
                              {...register(`faqs.${index}.answer`)}
                              placeholder="Answer"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-y transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      )}
      
      <Footer />
    </div>
  );
};

export default EditArticle; 