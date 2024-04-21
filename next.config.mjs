/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/login',
                destination: '/login/id',
                permanent: true
            }
        ]
    }
};

export default nextConfig;
