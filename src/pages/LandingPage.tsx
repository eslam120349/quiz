import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, BarChart3, Brain, Clock, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Brain,
    title: "Smart Quiz Builder",
    description: "Create rich quizzes with multiple choice, essays, math equations, code blocks, and image uploads.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Clock,
    title: "Timed Assessments",
    description: "Set time limits with visible countdowns and auto-submit when the timer expires.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Shield,
    title: "Anti-Cheating",
    description: "Tab-switch detection, question randomization, and one-attempt enforcement keep exams fair.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: BarChart3,
    title: "Instant Analytics",
    description: "Auto-grading, score distribution charts, and exportable results at your fingertips.",
    color: "bg-info/10 text-info",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share quizzes via unique links or codes. Students can start in seconds.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed — quizzes load instantly on any device, anywhere.",
    color: "bg-warning/10 text-warning",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">QuizMaster</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Built for Educators
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 font-display text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl"
            >
              Create Quizzes{" "}
              <span className="text-gradient-hero">That Inspire</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl"
            >
              The all-in-one quiz platform with rich content editing, timed assessments, anti-cheating,
              and instant analytics.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Button size="lg" className="h-13 px-8 text-base" asChild>
                <Link to="/auth/register">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-13 px-8 text-base" asChild>
                <Link to="/auth/login">Sign In</Link>
              </Button>
            </motion.div>
          </div>
        </div>
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-muted-foreground">
              Powerful tools designed to make quiz creation and assessment effortless.
            </p>
          </motion.div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-medium hover:-translate-y-1"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl overflow-hidden rounded-2xl gradient-hero p-12 text-center md:p-16"
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Transform Your Assessments?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
              Join thousands of educators creating engaging quizzes with QuizMaster Pro.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 h-13 px-8 text-base"
              asChild
            >
              <Link to="/auth/register">
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 QuizMaster Pro. Built for educators.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
