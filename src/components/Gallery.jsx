import React from 'react';

const Gallery = ({ monuments, showDetail }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extralight text-center text-gray-900 mb-12">
                Explore...
            </h2>
            <div className="flex overflow-x-auto gap-8 px-4 py-6 hide-scrollbar">
                {monuments.map((monument) => (
                    <div
                        key={monument.id}
                        className="relative w-64 h-96 min-w-[16rem] transform perspective-1000 group cursor-pointer"
                        onClick={() => showDetail(monument)}
                    >
                        <div className="absolute w-full h-full rounded-2xl shadow-xl transition-transform duration-500 ease-in-out transform-gpu preserve-3d group-hover:rotate-y-10 group-hover:scale-105">
                            <img
                                src={monument.imageUrl}
                                alt={monument.title}
                                className="absolute inset-0 w-full h-full object-cover rounded-2xl backface-hidden"
                            />
                            <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-t from-black/70 to-transparent flex items-end p-6 backface-hidden">
                                <h3 className="text-white text-2xl font-bold">{monument.title}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Gallery;
