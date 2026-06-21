// Homepage.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/homepage.css';

// Professional SVG Icons
const Icons = {
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Heart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.54L12 21.35Z" fill="currentColor"/>
    </svg>
  ),
  Vision: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4.5C7.5 4.5 3.5 7.5 1 12c2.5 4.5 6.5 7.5 11 7.5s8.5-3 11-7.5c-2.5-4.5-6.5-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="currentColor"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
    </svg>
  ),
  Target: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
    </svg>
  ),
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7V12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Innovation: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 3V6M15 3V6M5 9H19M5 15H19M6 21H18C19.1 21 20 20.1 20 19V7C20 5.9 19.1 5 18 5H6C4.9 5 4 5.9 4 7V19C4 20.1 4.9 21 6 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 13H16M8 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Experience: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8V12L15 15M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  About: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 20C4 16.13 7.58 13 12 13C16.42 13 20 16.13 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Quality: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="currentColor"/>
    </svg>
  ),
  Location: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="9" r="3" fill="currentColor"/>
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1z" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  Email: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 6L12 13L2 6M2 4h20v16H2V4z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowDown: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Code: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Document: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 12H16M8 8H12M8 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Leader: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="currentColor"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  FaceAnalysis: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
    </svg>
  ),
  SkinAnalysis: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M3 17L12 22L21 17" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="7" r="2" fill="currentColor"/>
    </svg>
  ),
  Map: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="10" r="3" fill="currentColor"/>
    </svg>
  ),
  AI: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 12v10" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Recommendation: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Download: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3v12m0 0-3-3m3 3 3-3M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  QrCode: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3H9V9H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 3H21V9H15V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 15H9V21H3V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 15H17V17H15V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 15H21V17H17V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 17H17V21H15V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 17H21V19H19V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 19H19V21H15V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  VolumeUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10v4h3l5 5V5L6 10H3z" fill="currentColor"/>
    </svg>
  ),
  Power: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Play: () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)" stroke="white" strokeWidth="1.5"/>
      <path d="M10 8L16 12L10 16V8Z" fill="white"/>
    </svg>
  )
};

const Homepage = () => {
  const heroRef = useRef(null);
  const missionRef = useRef(null);
  const aboutRef = useRef(null);
  const teamRef = useRef(null);
  const contactRef = useRef(null);
  const downloadRef = useRef(null);
  const trailerRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef(null);
  
  const [sectionVisibility, setSectionVisibility] = useState({
    mission: false,
    about: false,
    team: false,
    contact: false,
    download: false,
    trailer: false
  });

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

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

  const checkVisibility = useCallback(() => {
    const sections = [
      { id: 'mission-section', key: 'mission', ref: missionRef },
      { id: 'about-section', key: 'about', ref: aboutRef },
      { id: 'team-section', key: 'team', ref: teamRef },
      { id: 'contact-section', key: 'contact', ref: contactRef },
      { id: 'download-section', key: 'download', ref: downloadRef },
      { id: 'trailer-section', key: 'trailer', ref: trailerRef }
    ];

    const newVisibility = { ...sectionVisibility };
    let hasChanges = false;

    sections.forEach(({ id, key }) => {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 80 && rect.bottom > 80;
        
        if (isVisible !== sectionVisibility[key]) {
          newVisibility[key] = isVisible;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setSectionVisibility(newVisibility);
    }
  }, [sectionVisibility]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [heroRef, missionRef, aboutRef, teamRef, contactRef, downloadRef, trailerRef];
      const scrollPosition = window.scrollY + 150;
      
      sections.forEach((section, index) => {
        if (section.current) {
          const offsetTop = section.current.offsetTop;
          const offsetBottom = offsetTop + section.current.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            document.querySelectorAll('.nav-link').forEach((link, i) => {
              if (i === index) link.classList.add('active');
              else link.classList.remove('active');
            });
          }
        }
      });

      checkVisibility();
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    window.addEventListener('resize', checkVisibility);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [checkVisibility]);

  const teamMembers = [
    {
      id: 1,
      name: "Arnel Bullo",
      role: "Researcher",
      description: "Lead architect and full stack developer responsible for system design, database architecture, API development, and frontend integration.",
      image: "/nel.jpg",
      icon: "leader",
      expertise: ["React", "Node.js", "MongoDB", "System Architecture"]
    },
    {
      id: 2,
      name: "Hannah Maejoy Bernolia",
      role: "Researcher",
      description: "Heads documentation team, ensuring technical specifications, user manuals, and system guides are comprehensive and well-structured.",
      image: "/hannah.jpg",
      icon: "document",
      expertise: ["Technical Writing", "QA Documentation", "Process Mapping"]
    },
    {
      id: 3,
      name: "Crisha Arlene Antonio",
      role: "Researcher",
      description: "Creates detailed system documentation, API references, and user guides with version control and consistency.",
      image: "/crish.jpg",
      icon: "document",
      expertise: ["User Guides", "API Docs", "Content Organization"]
    },
    {
      id: 4,
      name: "Jeremiah Estillore",
      role: "Researcher",
      description: "Focuses on technical writing and knowledge base management for both technical and non-technical stakeholders.",
      image: "/jer.jpg",
      icon: "document",
      expertise: ["Technical Writing", "Knowledge Base", "Tutorial Creation"]
    }
  ];

  const coreValues = [
    { icon: <Icons.Quality />, title: "Excellence", description: "Delivering superior medical care" },
    { icon: <Icons.Innovation />, title: "Innovation", description: "Cutting-edge treatments" },
    { icon: <Icons.Shield />, title: "Integrity", description: "Ethical and transparent practice" }
  ];

  const appFeatures = [
    {
      icon: <Icons.FaceAnalysis />,
      title: "Face Analysis",
      description: "Advanced AI-powered facial analysis that evaluates skin texture, tone, wrinkles, pores, and overall facial health. Get personalized recommendations for skincare routines, products, and treatments tailored to your unique facial characteristics."
    },
    {
      icon: <Icons.SkinAnalysis />,
      title: "Skin Disease Detection",
      description: "Cutting-edge computer vision technology identifies potential skin conditions including acne, eczema, psoriasis, rosacea, and more. Upload an image of your skin concern and receive AI-assisted preliminary assessment and recommended next steps."
    },
    {
      icon: <Icons.Recommendation />,
      title: "Smart Recommendations",
      description: "Based on your analysis results, our AI engine generates personalized recommendations including skincare products, treatment options, lifestyle adjustments, and preventive care strategies tailored to your specific needs."
    },
    {
      icon: <Icons.Map />,
      title: "Nearby Resource Mapping",
      description: "Interactive map showing nearby dermatologists, clinics, hospitals, and skin care shops. Find verified healthcare providers and purchase recommended products from trusted local retailers in your area."
    },
    {
      icon: <Icons.AI />,
      title: "AI-Powered Insights",
      description: "Our deep learning models are trained on thousands of dermatological images and clinical data to provide accurate, evidence-based analysis. Continuous learning ensures our recommendations stay current with the latest medical research."
    }
  ];

  const downloadBenefits = [
    "AI-Powered Skin Analysis at Your Fingertips",
    "Real-time Disease Detection & Recommendations",
    "Connect with Dermatologists Near You",
    "Personalized Skincare Routines",
    "Track Your Skin Health Progress",
    "Secure & Private Health Data"
  ];

  return (
    <div className="homepage">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={() => scrollToSection(heroRef)}>
            <img src="/logo2.png" alt="Logo" className="logo-image" />
          </div>
          <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <button className="nav-link" onClick={() => scrollToSection(heroRef)}>Home</button>
            <button className="nav-link" onClick={() => scrollToSection(missionRef)}>Mission & Vision</button>
            <button className="nav-link" onClick={() => scrollToSection(aboutRef)}>About</button>
            <button className="nav-link" onClick={() => scrollToSection(teamRef)}>Team</button>
            <button className="nav-link" onClick={() => scrollToSection(contactRef)}>Contact</button>
            <button className="nav-link" onClick={() => scrollToSection(trailerRef)}>Trailer</button>
            <button className="nav-link download-nav-link" onClick={() => scrollToSection(downloadRef)}>Download</button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-bg-pattern"></div>
        <div className="hero-content">
          <img src="/logo2.png" alt="Logo" className="hero-logo animate-fade-up" />
          <div className="hero-divider animate-fade-up-delay"></div>
          <p className="hero-subtitle animate-fade-up-delay-2">
            AI-Driven Personalized Skin Analysis
          </p>
          <button className="hero-cta animate-fade-up-delay-3" onClick={() => scrollToSection(aboutRef)}>
            Explore Our Features
            <Icons.ArrowRight />
          </button>
        </div>
        <div className="scroll-indicator" onClick={() => scrollToSection(missionRef)}>
          <span>Scroll to explore</span>
          <Icons.ArrowDown />
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section 
        id="mission-section" 
        ref={missionRef} 
        className={`mission-vision-section ${sectionVisibility.mission ? 'section-visible' : 'section-hidden'}`}
      >
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Our Foundation</span>
            <h2 className="section-title">Mission & Vision</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">Driving excellence in dermatological care through purpose and foresight</p>
          </div>
          <div className="mv-grid">
            <div className="mv-card mission-card">
              <div className="mv-icon-wrapper">
                <div className="mv-icon"><Icons.Target /></div>
              </div>
              <h3>Our Mission</h3>
              <p>To democratize dermatological care by providing accessible, AI-powered skin analysis tools that empower individuals to understand their skin health, connect with quality healthcare providers, and make informed decisions about their skincare journey.</p>
              <div className="mv-features">
                <div className="mv-feature"><Icons.Check /> <span>Accessible Healthcare</span></div>
                <div className="mv-feature"><Icons.Check /> <span>AI-Powered Analysis</span></div>
                <div className="mv-feature"><Icons.Check /> <span>Empowered Patients</span></div>
              </div>
            </div>
            <div className="mv-card vision-card">
              <div className="mv-icon-wrapper">
                <div className="mv-icon"><Icons.Vision /></div>
              </div>
              <h3>Our Vision</h3>
              <p>To become the leading digital health platform for dermatology, combining cutting-edge artificial intelligence with compassionate care, making professional-grade skin analysis and quality healthcare guidance available to everyone, anywhere.</p>
              <div className="mv-features">
                <div className="mv-feature"><Icons.Check /> <span>Global Accessibility</span></div>
                <div className="mv-feature"><Icons.Check /> <span>Continuous Innovation</span></div>
                <div className="mv-feature"><Icons.Check /> <span>Trusted Guidance</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Bar */}
      <div className="core-values-bar">
        <div className="container">
          <div className="core-values-grid">
            {coreValues.map((value, index) => (
              <div key={index} className="core-value-item">
                <div className="core-value-icon">{value.icon}</div>
                <div className="core-value-content">
                  <h4>{value.title}</h4>
                  <p>{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <section 
        id="about-section" 
        ref={aboutRef} 
        className={`about-section ${sectionVisibility.about ? 'section-visible' : 'section-hidden'}`}
      >
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <span className="section-tag">Who We Are</span>
              <h2 className="section-title">About Med E-skin</h2>
              <div className="section-divider left"></div>
              <p className="about-text">
                Med E-skin is an innovative digital health platform that leverages artificial intelligence to revolutionize dermatological care. Our mission is to make professional-grade skin analysis accessible to everyone, providing accurate, real-time insights about skin health and potential concerns.
              </p>
              <p className="about-text">
                At the heart of Med E-skin are two powerful AI-driven analysis systems. The Face Analysis feature evaluates facial characteristics including skin texture, tone, wrinkles, pores, and overall facial health. Our proprietary algorithms analyze uploaded images to provide detailed assessments and personalized recommendations for skincare routines, products, and treatments tailored to each user's unique facial characteristics.
              </p>
              <p className="about-text">
                The Skin Disease Detection system uses advanced computer vision technology to identify potential skin conditions including acne, eczema, psoriasis, rosacea, and various other dermatological concerns. Users can simply upload an image of their skin concern and receive an AI-assisted preliminary assessment, helping them understand potential issues and determine appropriate next steps in consultation with healthcare professionals.
              </p>
              <p className="about-text">
                Beyond analysis, Med E-skin features an intelligent recommendation engine that suggests skincare products, treatment options, lifestyle adjustments, and preventive care strategies based on individual results. Our integrated mapping system helps users locate nearby dermatologists, clinics, hospitals, and skin care shops, creating a seamless bridge between digital analysis and real-world care. All of this is powered by deep learning models trained on thousands of dermatological images and clinical data, ensuring accurate, evidence-based insights that stay current with the latest medical research.
              </p>
            </div>
            <div className="about-features-list">
              <h3>Key Features</h3>
              {appFeatures.map((feature, index) => (
                <div key={index} className="about-feature-item">
                  <div className="about-feature-icon">{feature.icon}</div>
                  <div className="about-feature-text">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet The Team Section */}
      <section 
        id="team-section" 
        ref={teamRef} 
        className={`team-section ${sectionVisibility.team ? 'section-visible' : 'section-hidden'}`}
      >
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Meet Our Team</span>
            <h2 className="section-title">The Minds Behind Med E-skin</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">A dedicated team of professionals committed to excellence in dermatology and system innovation</p>
          </div>
          <div className="team-grid-2x2">
            {teamMembers.map((member, index) => (
              <div key={member.id} className={`team-card team-card-${index + 1}`}>
                <div className="team-card-inner">
                  <div className="team-image-wrapper">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="team-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/240x240?text=Team';
                      }}
                    />
                    <div className="team-icon-badge">
                      {member.icon === 'leader' ? <Icons.Leader /> : <Icons.Document />}
                    </div>
                  </div>
                  <div className="team-info">
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-description">{member.description}</p>
                    <div className="team-expertise">
                      {member.expertise.map((skill, idx) => (
                        <span key={idx} className="expertise-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact-section" 
        ref={contactRef} 
        className={`contact-section ${sectionVisibility.contact ? 'section-visible' : 'section-hidden'}`}
      >
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Get In Touch</span>
            <h2 className="section-title">Contact Us</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">Reach out with any questions about our platform or partnership opportunities</p>
          </div>
          <div className="contact-wrapper">
            <div className="contact-info-centered">
              <div className="contact-card-centered">
                <div className="contact-icon-centered">
                  <Icons.Location />
                </div>
                <div className="contact-details-centered">
                  <h4>Get In Touch</h4>
                  <p>We're here to help</p>
                  <p>Message us anytime</p>
                </div>
              </div>
              <div className="contact-card-centered">
                <div className="contact-icon-centered">
                  <Icons.Phone />
                </div>
                <div className="contact-details-centered">
                  <h4>Call Us</h4>
                  <p>0995 013 5553</p>
                </div>
              </div>
              <div className="contact-card-centered">
                <div className="contact-icon-centered">
                  <Icons.Email />
                </div>
                <div className="contact-details-centered">
                  <h4>Email Us</h4>
                  <p>mede-skin@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Trailer Section - Clean Video Only */}
      <section 
        id="trailer-section" 
        ref={trailerRef} 
        className={`trailer-section ${sectionVisibility.trailer ? 'section-visible' : 'section-hidden'}`}
      >
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Watch Our Trailer</span>
            <h2 className="section-title">See Med E-skin in Action</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">Experience how our AI technology transforms skin health analysis</p>
          </div>
          
          <div className="video-wrapper-premium">
            <div className="video-card-premium">
              <div className="video-container-premium">
                <video
                  ref={videoRef}
                  className="trailer-video-premium"
                  src="/trailer.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="video-overlay-premium" onClick={toggleVideoPlay}>
                  {!isVideoPlaying && (
                    <button className="play-btn-premium">
                      <Icons.Play />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section 
        id="download-section" 
        ref={downloadRef} 
        className={`download-section ${sectionVisibility.download ? 'section-visible' : 'section-hidden'}`}
      >
        <div className="container">
          <div className="download-wrapper">
            <div className="download-content">
              <span className="section-tag download-tag">Get The App</span>
              <h2 className="download-title">Download Med E-skin App</h2>
              <div className="download-divider"></div>
              <p className="download-description">
                Take control of your skin health with our AI-powered mobile application. 
                Scan the QR code to download directly to your device.
              </p>
              
              <div className="download-benefits">
                {downloadBenefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className={`benefit-item benefit-animate benefit-animate-${index + 1}`}
                  >
                    <div className="benefit-check">
                      <Icons.Check />
                    </div>
                    <span className="benefit-text">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="qr-note">
                <Icons.QrCode />
                <span>Scan QR code to download directly</span>
              </div>

              <div className="android-available-container">
                <span className="android-available-text">Available on Android</span>
              </div>
            </div>

            <div className="download-qr">
              <div className="phone-mockup-modern">
                <div className="phone-dynamic-island">
                  <div className="dynamic-island-content">
                    <div className="time-indicator">9:41</div>
                  </div>
                </div>
                
                <div className="phone-screen-modern">
                  <div className="phone-screen-inner">
                    <img 
                      src="/mediskinqr.jpg" 
                      alt="Download Mediskin App QR Code" 
                      className="qr-image-modern"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/280x280?text=QR+Code';
                      }}
                    />
                    <div className="qr-label">SCAN TO DOWNLOAD</div>
                  </div>
                </div>
                
                <div className="phone-side-buttons">
                  <div className="side-button volume-up">
                    <Icons.VolumeUp />
                  </div>
                  <div className="side-button volume-down"></div>
                  <div className="side-button power">
                    <Icons.Power />
                  </div>
                </div>
                
                <div className="phone-home-indicator"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/logo2.png" alt="Logo" className="footer-logo-image" />
            </div>
            <div className="footer-links">
              <button onClick={() => scrollToSection(heroRef)}>Home</button>
              <button onClick={() => scrollToSection(missionRef)}>Mission & Vision</button>
              <button onClick={() => scrollToSection(aboutRef)}>About</button>
              <button onClick={() => scrollToSection(teamRef)}>Team</button>
              <button onClick={() => scrollToSection(contactRef)}>Contact</button>
              <button onClick={() => scrollToSection(trailerRef)}>Trailer</button>
              <button onClick={() => scrollToSection(downloadRef)}>Download</button>
            </div>
            <div className="footer-copyright">
              © 2026 Med E-skin AI. All rights reserved. | Developed by Arnel Bullo & Team
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;