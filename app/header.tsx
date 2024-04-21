'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import type { LSAccount } from './types';

export default function Header() {
    const [account, setAccount] = useLocalStorage<LSAccount | null>('account', null);
    const [isValidToken, setIsValidToken] = useState(false);

    useEffect(() => {
        if (navigator.userAgent.includes('KAKAO')) {
          location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000');
        }
      }, []);
    useEffect(() => {
        if (account && account.token) {
            fetch('/api/check_token', {
                headers: { Authorization: account.token }
            }).then(async res => {
                if (res.ok) {
                    setIsValidToken(true);
                } else {
                    setIsValidToken(false);
                    setAccount(null);
                }
            });
        }
    }, [account, setAccount]);

    return (
        <header className="sticky w-full grid grid-cols-[auto_1fr_auto] p-4 h-24">
            <Link href="/" className="grid grid-cols-[auto_auto]">
                <Image src="/icon3.png" alt={process.env.NEXT_PUBLIC_TITLE || '숙제 트래커'} width={48} height={48} className="h-12 w-12" />
                <div className="grid grid-rows-[1fr_auto_1fr] h-12">
                    <div></div>
                    <span className="ml-2 text-3xl font-semibold">{process.env.NEXT_PUBLIC_TITLE || '숙제 트래커'}</span>
                    <div></div>
                </div>
            </Link>
            <div></div>
            {account && account.token && isValidToken
                ? <Link href="/account">
                    <Image src="/account.svg" alt="계정" width={36} height={36} className="dark:invert mr-2 mt-1.5 mb-1.5 h-9" />
                </Link>
                : <Link href="/login/id">
                    <button className="mr-2 p-3 mt-0 rounded-lg bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:hover:bg-gray-500 dark:disabled:hover:bg-gray-700 transition-all ease-in-out duration-200 focus:ring">로그인</button>
                </Link>
            }
        </header>
    );
}