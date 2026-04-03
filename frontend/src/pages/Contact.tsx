import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  ArrowLeft,
  ShieldCheck,
  Headphones,
  Zap,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call - replace with actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          timestamp: new Date().toISOString()
        })
      });

      // For demo purposes, we'll simulate success even if API doesn't exist
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to send message');
      }
      
      // Mock successful submission
      console.log('Contact form submitted:', formData);
      setIsSubmitted(true);
      setFormData({ fullName: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ email: 'Failed to send message. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-2xl p-12 rounded-[32px] shadow-2xl text-center border border-slate-100 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Message Sent Successfully!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Thank you for contacting Kredia. Our team will get back to you within 24 hours.
          </p>
          <Link 
            to="/" 
            className="btn-primary px-8 py-3 inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- HERO SECTION --- */}
      <section className="bg-slate-900 text-white pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Kredia
          </Link>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[0.95]">
            Contact Our <br />
            <span className="text-gradient">Financial Team</span>
          </h1>
          
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium mb-12">
            Get expert support and guidance for your financial journey. 
            Our team is here to help you succeed with Kredia.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Average response time: 2 hours</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <ShieldCheck size={16} />
              <span className="text-sm font-medium">Bank-level security</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTACT FORM & INFO --- */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 font-medium ${
                        errors.fullName 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <AlertCircle size={14} />
                        {errors.fullName}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 font-medium ${
                        errors.email 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <AlertCircle size={14} />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={handleInputChange('subject')}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 font-medium ${
                        errors.subject 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                      }`}
                    >
                      <option value="">Select a subject</option>
                      <option value="support">Technical Support</option>
                      <option value="account">Account Issues</option>
                      <option value="billing">Billing Questions</option>
                      <option value="feature">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.subject && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <AlertCircle size={14} />
                        {errors.subject}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                      Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      rows={6}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none text-slate-900 font-medium resize-none ${
                        errors.message 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white'
                      }`}
                      placeholder="Tell us how we can help you..."
                    />
                    {errors.message && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <AlertCircle size={14} />
                        {errors.message}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Cards */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Email Support</p>
                      <p className="text-slate-600">support@kredia.com</p>
                      <p className="text-sm text-slate-500">24/7 Available</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Phone Support</p>
                      <p className="text-slate-600">+1 (555) 123-4567</p>
                      <p className="text-sm text-slate-500">Mon-Fri, 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Office</p>
                      <p className="text-slate-600">123 Financial District</p>
                      <p className="text-slate-600">New York, NY 10004</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Business Hours</p>
                      <p className="text-slate-600">Monday - Friday: 9AM - 6PM</p>
                      <p className="text-slate-600">Saturday: 10AM - 4PM</p>
                      <p className="text-slate-600">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Contact Us */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
                <h3 className="text-xl font-bold mb-6">Why Contact Kredia?</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap size={20} className="text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Quick Response</p>
                      <p className="text-sm text-indigo-100">Average response time under 2 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck size={20} className="text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Secure Support</p>
                      <p className="text-sm text-indigo-100">Your data is always protected</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users size={20} className="text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Expert Team</p>
                      <p className="text-sm text-indigo-100">Financial specialists ready to help</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Headphones size={20} className="text-yellow-300 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">24/7 Support</p>
                      <p className="text-sm text-indigo-100">Always here when you need us</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
