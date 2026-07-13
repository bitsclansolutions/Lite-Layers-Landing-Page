import Navbar              from '../components/Navbar';
import HeroSection         from '../sections/HeroSection';
import StatsSection        from '../sections/StatsSection';
import HowItWorksSection   from '../sections/HowItWorksSection';
import FeaturesSection     from '../sections/FeaturesSection';
import ShowcaseSection     from '../sections/ShowcaseSection';
import ScenesSection       from '../sections/ScenesSection';
import ComingSoonSection   from '../sections/ComingSoonSection';
import TestimonialsSection from '../sections/TestimonialsSection';
import DownloadSection     from '../sections/DownloadSection';
import FooterSection       from '../sections/FooterSection';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ShowcaseSection />
      <ScenesSection />
      <ComingSoonSection />
      <TestimonialsSection />
      <DownloadSection />
      <FooterSection />
    </>
  );
}
