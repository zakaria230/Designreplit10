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

// Add your customer testimonials here when you have them
const testimonials: Testimonial[] = [];

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
        
        {testimonials.length > 0 ? (
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
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Customer testimonials will be displayed here as they become available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
