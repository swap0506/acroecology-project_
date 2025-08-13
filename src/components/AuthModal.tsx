// import React, { useState } from 'react';
// import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
// import { SignIn, SignUp } from '@clerk/clerk-react';

// interface AuthModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onLogin: (email: string, password: string) => void;
//   onSignup: (name: string, email: string, password: string) => void;
// }

// const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
//   const [isLoginMode, setIsLoginMode] = useState(true);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState<string[]>([]);

//   if (!isOpen) return null;

//   const validateForm = () => {
//     const newErrors: string[] = [];
    
//     if (!isLoginMode && !formData.name.trim()) {
//       newErrors.push('Name is required');
//     }
    
//     if (!formData.email.trim()) {
//       newErrors.push('Email is required');
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.push('Please enter a valid email');
//     }
    
//     if (!formData.password.trim()) {
//       newErrors.push('Password is required');
//     } else if (formData.password.length < 6) {
//       newErrors.push('Password must be at least 6 characters');
//     }
    
//     setErrors(newErrors);
//     return newErrors.length === 0;
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;
    
//     if (isLoginMode) {
//       onLogin(formData.email, formData.password);
//     } else {
//       onSignup(formData.name, formData.email, formData.password);
//     }
    
//     // Reset form
//     setFormData({ name: '', email: '', password: '' });
//     setErrors([]);
//     onClose();
//   };

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors.length > 0) {
//       setErrors([]);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <h2 className="text-2xl font-bold text-gray-800">
//             {isLoginMode ? 'Welcome Back' : 'Join CropVision'}
//           </h2>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <X size={20} className="text-gray-500" />
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {/* Error Messages */}
//           {errors.length > 0 && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//               {errors.map((error, index) => (
//                 <p key={index} className="text-red-600 text-sm">{error}</p>
//               ))}
//             </div>
//           )}

//           {/* Name Field (Signup only) */}
//           {!isLoginMode && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Full Name
//               </label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                 <input
//                   type="text"
//                   value={formData.name}
//                   onChange={(e) => handleInputChange('name', e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
//                   placeholder="Enter your full name"
//                 />
//               </div>
//             </div>
//           )}

//           {/* Email Field */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//               <input
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) => handleInputChange('email', e.target.value)}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
//                 placeholder="Enter your email"
//               />
//             </div>
//           </div>

//           {/* Password Field */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 value={formData.password}
//                 onChange={(e) => handleInputChange('password', e.target.value)}
//                 className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
//                 placeholder="Enter your password"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//               </button>
//             </div>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
//           >
//             {isLoginMode ? 'Sign In' : 'Create Account'}
//           </button>

//           {/* Toggle Mode */}
//           <div className="text-center pt-4 border-t border-gray-200">
//             <p className="text-gray-600">
//               {isLoginMode ? "Don't have an account?" : "Already have an account?"}
//               <button
//                 type="button"
//                 onClick={() => {
//                   setIsLoginMode(!isLoginMode);
//                   setErrors([]);
//                   setFormData({ name: '', email: '', password: '' });
//                 }}
//                 className="ml-2 text-green-600 hover:text-green-700 font-semibold"
//               >
//                 {isLoginMode ? 'Sign Up' : 'Sign In'}
//               </button>
//             </p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AuthModal;

// // const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
// //   if (!isOpen) return null;

// //   return (
// //     <div>
// //       <button onClick={onClose}>Close</button>
// //       <SignIn />
// //       {/* Or use <SignUp /> for signup functionality */}
// //     </div>
// //   );
// // };
