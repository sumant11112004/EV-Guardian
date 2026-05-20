import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutUs from '@/components/AboutUs';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white">
      <Navbar />
      
      <div className="flex-1 relative z-10 pt-8 pb-12">
        <AboutUs />
      </div>
      
      <Footer />
    </div>
  );
}
