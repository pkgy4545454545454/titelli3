import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Award, Crown, CheckCircle, ArrowRight, Play, Sparkles, TrendingUp, Gift, Users, Briefcase, MapPin, Clock, X, FileText, Send, Filter, GraduationCap, Calendar, Pause, Volume2, VolumeX } from 'lucide-react';
import { featuredAPI, categoryAPI, enterpriseAPI, servicesProductsAPI, jobsAPI, clientDocumentsAPI, trainingsAPI } from '../services/api';
import EnterpriseCard from '../components/EnterpriseCard';
import ServiceProductCard from '../components/ServiceProductCard';
import ScrollingReviews from '../components/ScrollingReviews';
import { toast } from 'sonner';

const HomePage = () => {
  const navigate = useNavigate();
  const [tendances, setTendances] = useState([]);
  const [guests, setGuests] = useState([]);
  const [offres, setOffres] = useState([]);
  const [premium, setPremium] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [jobFilters, setJobFilters] = useState({
    type: '',
    location: '',
    enterprise: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Application Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [applyForm, setApplyForm] = useState({
    resume_url: '',
    cover_letter: ''
  });
  const [applying, setApplying] = useState(false);
  
  // Training purchase state
  const [purchasingTraining, setPurchasingTraining] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tendRes, guestRes, offreRes, premRes, prodCatRes, servCatRes, jobsRes, trainingsRes] = await Promise.all([
          featuredAPI.tendances(),
          featuredAPI.guests(),
          featuredAPI.offres(),
          featuredAPI.premium(),
          categoryAPI.products(),
          categoryAPI.services(),
          jobsAPI.listAll().catch(() => ({ data: [] })),
          trainingsAPI.listAll({ limit: 6 }).catch(() => ({ data: [] }))
        ]);
        setTendances(tendRes.data);
        setGuests(guestRes.data);
        setOffres(offreRes.data);
        setPremium(premRes.data);
        setProductCategories(prodCatRes.data);
        setServiceCategories(servCatRes.data);
        const jobsData = jobsRes.data || [];
        setJobs(jobsData);
        setFilteredJobs(jobsData);
        setTrainings(trainingsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Apply filters
  useEffect(() => {
    let result = [...jobs];
    
    if (jobFilters.type) {
      result = result.filter(job => job.type === jobFilters.type);
    }
    
    if (jobFilters.location) {
      result = result.filter(job => 
        (job.location || '').toLowerCase().includes(jobFilters.location.toLowerCase())
      );
    }
    
    if (jobFilters.enterprise) {
      result = result.filter(job => 
        (job.enterprise_name || '').toLowerCase().includes(jobFilters.enterprise.toLowerCase())
      );
    }
    
    setFilteredJobs(result);
  }, [jobFilters, jobs]);
  
  // Open apply modal
  const handleApplyClick = async (e, job) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('titelli_token');
    if (!token) {
      toast.error('Connectez-vous pour postuler');
      return;
    }
    
    setSelectedJob(job);
    setApplyForm({ resume_url: '', cover_letter: '' });
    
    // Fetch user's documents (all types that could serve as CV)
    try {
      const res = await clientDocumentsAPI.list(); // Get all documents, not just CVs
      const allDocs = res.data?.documents || res.data || [];
      // Filter to only show CV and general documents (useful for job applications)
      const cvDocs = allDocs.filter(d => d.category === 'cv' || d.category === 'general' || d.file_type?.includes('pdf'));
      setUserDocuments(cvDocs.length > 0 ? cvDocs : allDocs); // If no CV/general, show all
    } catch (err) {
      console.error('Error fetching documents:', err);
      setUserDocuments([]);
    }
    
    setShowApplyModal(true);
  };
  
  // Submit application
  const handleSubmitApplication = async () => {
    if (!applyForm.resume_url) {
      toast.error('Veuillez sélectionner un CV');
      return;
    }
    
    setApplying(true);
    try {
      await jobsAPI.apply(selectedJob.id, {
        resume_url: applyForm.resume_url,
        cover_letter: applyForm.cover_letter
      });
      toast.success('Candidature envoyée avec succès !');
      setShowApplyModal(false);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erreur lors de l\'envoi';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  // Handle training purchase
  const handlePurchaseTraining = async (training) => {
    const token = localStorage.getItem('titelli_token');
    if (!token) {
      toast.error('Connectez-vous pour acheter une formation');
      navigate('/auth');
      return;
    }
    
    setPurchasingTraining(training.id);
    try {
      const res = await trainingsAPI.purchase(training.id);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erreur lors de l\'achat';
      toast.error(msg);
    } finally {
      setPurchasingTraining(null);
    }
  };

  // Video state for panoramic hero
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Panoramic video URL (using a beautiful stock video of Lausanne/city)
  const panoramicVideoUrl = 'head.mp4';
  const heroImage = 'https://images.unsplash.com/photo-1733950489642-bd1a7c3e69bb?w=1920&q=80';

  const mainCategories = [
    { id: 'services', label: 'Services', path: '/services', icon: Sparkles },
    { id: 'produits', label: 'Produits', path: '/products', icon: Gift },
    { id: 'certifies', label: 'Certifiés', path: '/certifies', icon: CheckCircle },
    { id: 'guests', label: 'Guests', path: '/guests', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="home-page">
      {/* Hero Section with Panoramic Video */}
      <section className="relative h-screen overflow-hidden" data-testid="hero-section">
        {/* Video Background */}
   <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={heroImage}
            style={{marginTop: '60px'}}
          >
            <source src={panoramicVideoUrl} type="video/mp4" />
          </video>
          <img 
            src={heroImage} 
            alt="Lausanne" 
            className="absolute inset-0 w-full h-70% object-cover -z-10"
          />
        </div>


        {/* Video Controls */}
        <div className="absolute bottom-8 right-8 flex items-center gap-3 z-20">
          <button 
            onClick={toggleVideoPlay}
            className="p-3 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 text-white hover:bg-black/70 transition-all"
            data-testid="video-play-btn"
            aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
          >
            {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleVideoMute}
            className="p-3 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 text-white hover:bg-black/70 transition-all"
            data-testid="video-mute-btn"
            aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
          >
            {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

            {/* Hero Content - Just title, no logo, no description */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-left px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-black  mb-8 animate-fade-in drop-shadow-lg" style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center',marginTop:'300px' }}>
            Les meilleurs prestataires<br />
            <span style={{ color: 'green' }}>de ta région</span>
          </h1>

          {/* Category Buttons - 2 rows */}
          <div className="flex flex-col items-start gap-1 animate-fade-in stagger-2">
            <div className="flex flex-wrap justify-start gap-2" style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center', marginTop: '60px' }}>
              {[
                { label: 'Services', path: '/services' },
                { label: 'Produits', path: '/products' },
                { label: 'Certifiés', path: '/certifies' },
                { label: 'Labelisés', path: '/labellises' },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.path}
                  className="px-4 py-2 bg-black/80 backdrop-blur-md border border-white/20 rounded-[10px] text-white text-sm hover:bg-white hover:text-black transition-all duration-300 min-w-[106px]"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2" style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center' }}>
              {[
                { label: 'Premium', path: '/premium' },
                { label: 'Tendances', path: '/tendances' },
                { label: 'Guests', path: '/guests' },
                { label: 'Offres', path: '/offres' },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.path}
                  className="px-4 py-2 bg-black/80 backdrop-blur-md border border-white/20 rounded-[10px] text-white text-sm hover:bg-white hover:text-black transition-all duration-300 min-w-[106px] justify-center m-x-auto"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Services Section - Blue Background */}
      <section className="py-20 md:py-28 section-blue" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                Les meilleurs services de ta région
              </h2>
              <p className="text-gray-400">Découvrez nos prestataires de confiance</p>
            </div>
            <Link to="/services" className="hidden md:flex items-center gap-2 text-[#0047AB] hover:text-[#2E74D6] font-medium transition-colors" data-testid="view-all-services">
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Service Category Tabs */}
          <div className="flex flex-wrap gap-3 mb-10">
            {serviceCategories.slice(0, 8).map((cat, index) => (
              <Link
                key={cat.id}
                to={`/services?category=${cat.id}`}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white transition-all"
                data-testid={`service-cat-${cat.id}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offres.length > 0 ? (
              offres.slice(0, 6).map((item, index) => (
                <div key={item.id} className={`animate-fade-in stagger-${index + 1}`}>
                  <ServiceProductCard item={item} />
                </div>
              ))
            ) : (
              // Placeholder cards
              [1, 2, 3].map((i) => (
                <div key={i} className="card-service rounded-xl overflow-hidden">
                  <div className="h-56 bg-white/5 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-white/5 rounded animate-pulse" />
                    <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                    <div className="h-8 bg-white/5 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))
            )}
          </div>

          <Link to="/services" className="md:hidden flex items-center justify-center gap-2 mt-8 text-[#0047AB] font-medium">
            Voir tous les services
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Product Categories Grid */}
      <section className="py-20 md:py-28" data-testid="products-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                Produits
              </h2>
              <p className="text-gray-400">Trouvez ce dont vous avez besoin</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center gap-2 text-[#D4AF37] hover:text-[#F3CF55] font-medium transition-colors">
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productCategories.slice(0, 8).map((cat, index) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group relative h-40 md:h-48 rounded-xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/5 hover:border-[#D4AF37]/30 transition-all"
                data-testid={`product-cat-${cat.id}`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Gift className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <span className="text-white font-medium text-sm md:text-base">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tendances Actuelles */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#0A0A0A] to-[#050505]" data-testid="tendances-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#D4AF37]/10">
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Tendances actuelles
                </h2>
                <p className="text-gray-400 mt-1">Nos prestataires labellisés du moment</p>
              </div>
            </div>
            <Link to="/labellises" className="hidden md:flex items-center gap-2 text-[#D4AF37] hover:text-[#F3CF55] font-medium transition-colors">
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tendances.length > 0 ? (
              tendances.map((enterprise, index) => (
                <div key={enterprise.id} className={`animate-fade-in stagger-${index + 1}`}>
                  <EnterpriseCard enterprise={enterprise} />
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="card-service rounded-xl h-80 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Guests du moment */}
      <section className="py-20 md:py-28" data-testid="guests-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#0047AB]/10">
                <CheckCircle className="w-6 h-6 text-[#0047AB]" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Guests du moment
                </h2>
                <p className="text-gray-400 mt-1">Nos prestataires certifiés</p>
              </div>
            </div>
            <Link to="/certifies" className="hidden md:flex items-center gap-2 text-[#0047AB] hover:text-[#2E74D6] font-medium transition-colors">
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guests.length > 0 ? (
              guests.map((enterprise, index) => (
                <div key={enterprise.id} className={`animate-fade-in stagger-${index + 1}`}>
                  <EnterpriseCard enterprise={enterprise} />
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="card-service rounded-xl h-80 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-20 md:py-28 relative overflow-hidden" data-testid="premium-section">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0047AB]/10 via-transparent to-[#D4AF37]/10" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#0047AB]">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Premium
                </h2>
                <p className="text-gray-400 mt-1">L'excellence à votre service</p>
              </div>
            </div>
            <Link to="/premium" className="hidden md:flex items-center gap-2 text-[#D4AF37] hover:text-[#F3CF55] font-medium transition-colors">
              Découvrir
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premium.length > 0 ? (
              premium.map((enterprise, index) => (
                <div key={enterprise.id} className={`animate-fade-in stagger-${index + 1}`}>
                  <EnterpriseCard enterprise={enterprise} />
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="card-service rounded-xl h-80 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Job Offers Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#050505] to-[#0A0A0A]" data-testid="jobs-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#0047AB]/20">
                <Briefcase className="w-6 h-6 text-[#0047AB]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Offres d'emploi
                </h2>
                <p className="text-gray-400 mt-1 text-sm md:text-base">Opportunités chez nos prestataires</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-[#0047AB] text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                data-testid="jobs-filter-btn"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres</span>
              </button>
              <Link to="/emplois" className="hidden md:flex items-center gap-2 text-[#0047AB] hover:text-[#2E74D6] font-medium transition-colors">
                Voir toutes les offres
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10 animate-fade-in" data-testid="jobs-filters">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type de contrat</label>
                  <select 
                    value={jobFilters.type}
                    onChange={(e) => setJobFilters({...jobFilters, type: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:border-[#0047AB] outline-none"
                    data-testid="jobs-filter-type"
                  >
                    <option value="">Tous les types</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Apprentissage">Apprentissage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ville</label>
                  <input 
                    type="text"
                    value={jobFilters.location}
                    onChange={(e) => setJobFilters({...jobFilters, location: e.target.value})}
                    placeholder="Ex: Lausanne, Genève..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0047AB] outline-none"
                    data-testid="jobs-filter-location"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Entreprise</label>
                  <input 
                    type="text"
                    value={jobFilters.enterprise}
                    onChange={(e) => setJobFilters({...jobFilters, enterprise: e.target.value})}
                    placeholder="Nom de l'entreprise..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#0047AB] outline-none"
                    data-testid="jobs-filter-enterprise"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => setJobFilters({ type: '', location: '', enterprise: '' })}
                    className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
              {filteredJobs.length !== jobs.length && (
                <p className="mt-4 text-sm text-[#0047AB]">{filteredJobs.length} résultat(s) sur {jobs.length}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.slice(0, 6).map((job, index) => (
                <div 
                  key={job.id} 
                  className={`card-service rounded-xl p-5 hover:border-[#0047AB]/30 transition-all animate-fade-in stagger-${index + 1}`}
                  data-testid={`job-card-${job.id}`}
                >
                  <Link to={`/emploi/${job.id}`} className="block">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#0047AB]/10 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-[#0047AB]" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm md:text-base">{job.title}</h3>
                          <p className="text-[#D4AF37] text-sm font-medium">{job.enterprise_name || 'Entreprise'}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        job.type === 'CDI' ? 'bg-green-500/20 text-green-400' :
                        job.type === 'CDD' ? 'bg-orange-500/20 text-orange-400' :
                        job.type === 'Stage' ? 'bg-purple-500/20 text-purple-400' :
                        job.type === 'Freelance' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {job.type || 'CDI'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{job.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location || 'Lausanne'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {job.salary || 'À discuter'}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => handleApplyClick(e, job)}
                    className="w-full bg-[#0047AB] hover:bg-[#0047AB]/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    data-testid={`job-apply-btn-${job.id}`}
                  >
                    <Send className="w-4 h-4" />
                    Postuler
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">
                  {jobs.length === 0 ? "Aucune offre d'emploi pour le moment" : "Aucune offre ne correspond aux filtres"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {jobs.length === 0 ? "Les offres de nos prestataires apparaîtront ici" : "Essayez d'autres critères de recherche"}
                </p>
              </div>
            )}
          </div>

          <Link to="/emplois" className="md:hidden flex items-center justify-center gap-2 mt-8 text-[#0047AB] font-medium">
            Voir toutes les offres
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Formations Section */}
      {trainings.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-b from-[#0A0A0A] to-[#050505]" data-testid="trainings-section">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Formations disponibles
                  </h2>
                  <p className="text-gray-400 mt-1 text-sm md:text-base">Développez vos compétences avec nos partenaires</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training) => (
                <div 
                  key={training.id} 
                  className="card-service rounded-xl overflow-hidden hover:scale-[1.02] transition-transform"
                  data-testid={`training-card-${training.id}`}
                >
                  {/* Training Header */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        training.training_type === 'online' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {training.training_type === 'online' ? '💻 En ligne' : '🏢 Présentiel'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                        {training.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">{training.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{training.description}</p>
                    
                    {/* Enterprise Info */}
                    <div className="flex items-center gap-2 mb-4">
                      {training.enterprise_logo ? (
                        <img 
                          src={training.enterprise_logo.startsWith('http') ? training.enterprise_logo : `${process.env.REACT_APP_BACKEND_URL}${training.enterprise_logo}`}
                          alt={training.enterprise_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0047AB]/30 flex items-center justify-center text-xs text-white font-bold">
                          {training.enterprise_name?.[0]}
                        </div>
                      )}
                      <span className="text-sm text-[#D4AF37]">{training.enterprise_name}</span>
                    </div>
                    
                    {/* Training Details */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {training.duration}
                      </span>
                      {training.training_type === 'on_site' && training.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {training.location}
                        </span>
                      )}
                      {training.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(training.start_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {training.certificate && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Certificat
                        </span>
                      )}
                    </div>
                    
                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <p className="text-2xl font-bold text-white">{training.price} <span className="text-sm font-normal text-gray-400">CHF</span></p>
                      </div>
                      <button
                        onClick={() => handlePurchaseTraining(training)}
                        disabled={purchasingTraining === training.id}
                        className="px-4 py-2 bg-[#0047AB] text-white rounded-lg hover:bg-[#0047AB]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        data-testid={`buy-training-${training.id}`}
                      >
                        {purchasingTraining === training.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Achat...
                          </>
                        ) : (
                          'S\'inscrire'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" data-testid="apply-modal">
          <div className="bg-[#0A0A0A] rounded-2xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Postuler à l'offre</h2>
                <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-semibold">{selectedJob.title}</h3>
                <p className="text-[#D4AF37] text-sm">{selectedJob.enterprise_name}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span>{selectedJob.type}</span>
                  <span>{selectedJob.location || 'Lausanne'}</span>
                </div>
              </div>
              
              {/* CV Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Sélectionnez votre CV *
                </label>
                {userDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {userDocuments.map((doc) => (
                      <label 
                        key={doc.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          applyForm.resume_url === doc.url 
                            ? 'bg-[#0047AB]/20 border border-[#0047AB]' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="resume"
                          value={doc.url}
                          checked={applyForm.resume_url === doc.url}
                          onChange={(e) => setApplyForm({...applyForm, resume_url: e.target.value})}
                          className="accent-[#0047AB]"
                        />
                        <FileText className="w-5 h-5 text-[#0047AB]" />
                        <div className="flex-1">
                          <span className="text-white text-sm">{doc.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({doc.category})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-white/5 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm mb-3">Vous n'avez pas encore de CV enregistré</p>
                    <Link 
                      to={`/dashboard/client?tab=documents&returnToJob=${selectedJob.id}`}
                      className="text-[#0047AB] hover:underline text-sm"
                      onClick={() => setShowApplyModal(false)}
                    >
                      Ajouter un CV dans mon espace →
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Cover Letter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Lettre de motivation (optionnel)</label>
                <textarea
                  value={applyForm.cover_letter}
                  onChange={(e) => setApplyForm({...applyForm, cover_letter: e.target.value})}
                  placeholder="Présentez-vous brièvement et expliquez votre motivation..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#0047AB] outline-none h-32 resize-none"
                  data-testid="apply-cover-letter"
                />
              </div>
              
              {/* Submit */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={applying || !applyForm.resume_url}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#0047AB] text-white hover:bg-[#0047AB]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="apply-submit-btn"
                >
                  {applying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer ma candidature
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrolling Reviews Section */}
      <ScrollingReviews 
        title="Ce que nos clients disent"
        speed={35}
      />

      {/* CTA Section */}
      <section className="py-20 md:py-28" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Vous êtes un prestataire ?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Rejoignez Titelli et exposez vos services aux clients de la région de Lausanne. 
            Bénéficiez d'une visibilité premium et développez votre activité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?type=entreprise" className="btn-primary text-lg px-10 py-4" data-testid="cta-register-btn">
              Inscrire mon entreprise
            </Link>
            <Link to="/about" className="btn-secondary text-lg px-10 py-4">
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
