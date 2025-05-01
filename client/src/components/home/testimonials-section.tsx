import { StarRating } from "@/components/ui/star-rating";

interface Testimonial {
  id: number;
  text: string;
  rating: number;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "The technical drawings I purchased saved me hours of work. The quality is exceptional and the attention to detail is impressive. I'll definitely be back for more assets.",
    rating: 5,
    author: {
      name: "Sarah Chen",
      role: "Fashion Designer at Studio Moda",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    id: 2,
    text: "As an independent designer, I rely on high-quality assets to speed up my workflow. DesignKorv's 3D models have been game-changing for my client presentations.",
    rating: 5,
    author: {
      name: "Michael Torres",
      role: "Freelance Fashion Designer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    id: 3,
    text: "The textile patterns I purchased were exactly what I needed for my latest collection. The seamless integration with my design software made the process incredibly efficient.",
    rating: 4.5,
    author: {
      name: "Emma Johnson",
      role: "Lead Designer at FashionForward",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="max-w-2xl mx-auto text-gray-500 dark:text-gray-400 text-lg">
            Designers around the world trust DesignKorv for premium digital fashion assets that enhance their creativity and productivity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm"
            >
              <div className="flex items-center mb-4">
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <img 
                  className="h-10 w-10 rounded-full" 
                  src={testimonial.author.avatar} 
                  alt={testimonial.author.name} 
                />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {testimonial.author.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {testimonial.author.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
