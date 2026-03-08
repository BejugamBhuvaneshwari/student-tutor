import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Calendar, MessageCircle, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TutorCard from "@/components/TutorCard";
import { mockTutors, subjects } from "@/data/mockData";
import heroIllustration from "@/assets/hero-illustration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const features = [
  { icon: Sparkles, title: "AI Matching", description: "Our AI analyzes learning styles to find your perfect tutor match." },
  { icon: Search, title: "Smart Search", description: "Filter by subject, price, location, ratings, and availability." },
  { icon: Calendar, title: "Easy Booking", description: "Book demo sessions or paid lessons with just a few clicks." },
  { icon: MessageCircle, title: "Real-Time Chat", description: "Message tutors directly before committing to a session." },
  { icon: Shield, title: "Verified Tutors", description: "Every tutor goes through our AI screening and verification process." },
  { icon: Zap, title: "Micro Sessions", description: "Quick 15-minute doubt-solving sessions for instant help." },
];

const steps = [
  { step: "01", title: "Tell Us Your Needs", description: "Share your subject, learning goals, and preferences." },
  { step: "02", title: "Get AI Recommendations", description: "Our algorithm matches you with compatible tutors." },
  { step: "03", title: "Book a Free Demo", description: "Try a 20-minute session before committing." },
  { step: "04", title: "Start Learning", description: "Schedule regular sessions and track your progress." },
];

const stats = [
  { value: "10,000+", label: "Verified Tutors" },
  { value: "50,000+", label: "Students" },
  { value: "200,000+", label: "Sessions Completed" },
  { value: "4.8★", label: "Average Rating" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              animate="visible"
              className="max-w-xl"
            >
              <motion.div variants={fadeUp} custom={0}>
                <Badge variant="secondary" className="mb-4 font-normal">
                  <Sparkles className="mr-1 h-3 w-3" /> AI-Powered Tutor Matching
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-heading text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
              >
                Find Your{" "}
                <span className="text-gradient-primary">Perfect Tutor</span>{" "}
                in Minutes
              </motion.h1>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="mt-4 text-lg text-muted-foreground"
              >
                TutorBridge AI uses intelligent matching to connect engineering students with
                expert tutors across CSE, AIML, ECE, EEE, Mechanical, Civil, and more.
              </motion.p>
              <motion.div
                variants={fadeUp}
                custom={3}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Button variant="hero" size="lg" asChild>
                  <Link to="/tutors">Find a Tutor</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/signup">Become a Tutor</Link>
                </Button>
                <Button variant="accent" size="lg" asChild>
                  <Link to="/login">Student Login</Link>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-10 flex gap-8"
              >
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="font-heading text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block"
            >
              <img
                src={heroIllustration}
                alt="Students and tutors connecting"
                className="w-full max-w-lg mx-auto animate-float"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="border-y border-border bg-card py-8">
        <div className="container">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground mr-2">Popular:</span>
            {subjects.slice(0, 10).map((subject) => (
              <Link key={subject} to={`/tutors?subject=${subject}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {subject}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl font-bold md:text-4xl">
              Why Choose TutorBridge AI?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We combine cutting-edge AI with a curated network of expert tutors to deliver a learning experience like no other.
            </motion.p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-heading text-3xl font-bold md:text-4xl">
              How It Works
            </motion.h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-hero font-heading text-xl font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="font-heading font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Tutors */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold">Top Rated Tutors</h2>
              <p className="mt-1 text-muted-foreground">Handpicked by our AI based on ratings and success rates</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/tutors">View All</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockTutors.slice(0, 3).map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-2xl bg-gradient-hero p-12 text-center">
            <h2 className="font-heading text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Start Learning?
            </h2>
            <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
              Join thousands of students who found their perfect tutor match through TutorBridge AI.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link to="/signup">Get Started Free</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/tutors">Browse Tutors</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
