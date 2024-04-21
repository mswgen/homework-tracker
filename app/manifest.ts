import { MetadataRoute } from "next";

export default function Manifest(): MetadataRoute.Manifest {
    return {
        "background_color": "white",
        "categories": ["education", "utilities"],
        "description": process.env.NEXT_PUBLIC_TITLE || "숙제 트래커",
        "display": "standalone",
        "icons": [
            {
                "src": "/icon1.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable"
            },
            {
                "src": "/icon2.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable"
            },
            {
                "src": "/icon3.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/icon4.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/icon5.png",
                "sizes": "96x96",
                "type": "image/png",
                "purpose": "any"
            }
        ],
        "id": process.env.NEXT_PUBLIC_ID || "homework-tracker",
        "name": process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
        "dir": "ltr",
        "lang": "ko-KR",
        "scope": "/",
        "short_name": process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
        "start_url": "/",
        "theme_color": "white",
        
    }
}