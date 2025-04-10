const EventBanner = ({ event }) => {
  const defaultEvent = {
    title: 'Paris Blockchain Week',
    description: 'Join us for the biggest blockchain event in Europe',
    imageUrl: 'https://placehold.co/1200x400',
    link: '#',
    date: 'March 20-24, 2024',
    location: 'Paris, France'
  };

  const currentEvent = event || defaultEvent;

  return (
    <div className="relative w-full h-[400px] overflow-hidden mb-8">
      <img
        src={currentEvent.imageUrl}
        alt={currentEvent.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black bg-opacity-70 to-transparent flex items-center">
        <div className="text-white px-8 md:px-16 max-w-2xl">
          <span className="inline-block bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            UPCOMING EVENT
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{currentEvent.title}</h2>
          <p className="text-xl md:text-2xl mb-4">{currentEvent.description}</p>
          <div className="flex items-center mb-6">
            <span className="mr-4 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {currentEvent.date}
            </span>
            <span className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {currentEvent.location}
            </span>
          </div>
          <a
            href={currentEvent.link}
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
};

export default EventBanner; 