// Loader.js
import React from "react";

const Loader = () => {
  return (
    <div className="loader">
      <style jsx>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3); /* Light border */
          border-left-color: #fff; /* Main color for the spinning effect */
          border-radius: 50%;
          width: 40px; /* Size of the loader */
          height: 40px; /* Size of the loader */
          animation: spin 1s linear infinite; /* Spin animation */
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg); 
          }
          100% {
            transform: rotate(360deg); /* End position */
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
