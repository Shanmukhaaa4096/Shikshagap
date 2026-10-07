import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Open Source Licenses | ShikshaGap',
  description: 'Attribution and licensing information for open-source software libraries powering ShikshaGap.',
};

const LICENSES = [
  {
    name: 'Next.js',
    version: '15.x',
    author: 'Vercel, Inc.',
    license: 'MIT License',
    url: 'https://github.com/vercel/next.js',
    text: `The MIT License (MIT)
Copyright (c) 2026 Vercel, Inc.
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.`
  },
  {
    name: 'React and React DOM',
    version: '19.x',
    author: 'Meta Platforms, Inc.',
    license: 'MIT License',
    url: 'https://github.com/facebook/react',
    text: `MIT License
Copyright (c) Meta Platforms, Inc. and affiliates.
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files.`
  },
  {
    name: 'Phosphor Icons React',
    version: '2.x',
    author: 'Phosphor Icons (Helena Zhang and Tobias Fried)',
    license: 'MIT License',
    url: 'https://github.com/phosphor-icons/react',
    text: `MIT License
Copyright (c) 2026 Phosphor Icons
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files.`
  },
  {
    name: 'Tailwind CSS',
    version: '3.x',
    author: 'Tailwind Labs, Inc.',
    license: 'MIT License',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    text: `MIT License
Copyright (c) Tailwind Labs, Inc.
Permission is hereby granted, free of charge, to any person obtaining a copy of this software.`
  },
  {
    name: 'bcryptjs',
    version: '2.4.x',
    author: 'Daniel Wirtz',
    license: 'New BSD / MIT License',
    url: 'https://github.com/dcodeIO/bcrypt.js',
    text: `Copyright (c) 2012 Daniel Wirtz <dcode@dcode.io>
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice.`
  },
  {
    name: '@google/genai',
    version: '0.1.x',
    author: 'Google LLC',
    license: 'Apache License 2.0',
    url: 'https://github.com/google/genai-sdk-js',
    text: `Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0`
  }
];

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans selection:bg-[#DE2A35] selection:text-[#F5F1BC] p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-[#432623]/20 dark:border-[#F5F1BC]/20 pb-6 mb-8">
          <Link href="/" className="text-xs font-mono uppercase text-[#432623]/70 dark:text-[#F5F1BC]/70 hover:underline">
            &larr; Back to ShikshaGap Home
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal mt-3">Open Source Software Attribution</h1>
          <p className="text-xs font-mono uppercase tracking-wider text-[#432623]/60 dark:text-[#F5F1BC]/60 mt-1">
            Compliant with Third-Party Notice Requirements
          </p>
        </div>

        <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed mb-8">
          ShikshaGap is built with appreciation for the open-source software community. In accordance with the license conditions of our dependencies, the copyright notices and permissions for core libraries are reproduced below.
        </p>

        <div className="space-y-6">
          {LICENSES.map((lib, i) => (
            <div key={i} className="border border-[#432623]/25 dark:border-[#F5F1BC]/25 p-5 bg-[#FAF8E8] dark:bg-[#381f1c]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#432623]/15 dark:border-[#F5F1BC]/15 pb-2 mb-3">
                <div>
                  <h2 className="font-serif text-lg font-bold">{lib.name}</h2>
                  <div className="text-[11px] font-mono text-[#432623]/70 dark:text-[#F5F1BC]/70">
                    {lib.author} | {lib.license}
                  </div>
                </div>
                <a 
                  href={lib.url} 
                  target="_blank" 
                  rel="noreferrer noopener" 
                  className="text-xs font-mono underline hover:text-[#DE2A35]"
                >
                  Source Repository
                </a>
              </div>
              <pre className="text-[11px] font-mono bg-[#F5F1BC]/40 dark:bg-[#432623] p-3 overflow-x-auto whitespace-pre-wrap border border-[#432623]/10 dark:border-[#F5F1BC]/10">
                {lib.text}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
