'use client';

import React from 'react';

interface IButtonProps
    extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {}

const Button: React.FC<IButtonProps> = ({ disabled, ...props }) => {
    return (
        <button
            {...props}
            className={`relative inline-flex items-center justify-center p-4 px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden font-medium transition duration-300 ease-out border-2 border-green-600 ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-green-600 hover:border-white active:scale-105'
            } rounded-full shadow-md group`}
            onClick={disabled ? undefined : props.onClick}
        >
            <span
                className={`flex items-center justify-center w-full h-full transition-all transform ${
                    disabled ? '' : 'group-hover:translate-y-px'
                } ease`}
            >
                {props.children}
            </span>
        </button>
    );
};

export default Button;
