import { QRCodeSVG } from 'qrcode.react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function QRCodeModal({ isOpen, onClose, url, alias }: { isOpen: boolean; onClose: ()=>void; url: string; alias: string }) {
  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0);
        const pngFile = canvas.toDataURL('image/png');
        const a = document.createElement('a'); a.download = `qr-${alias}.png`; a.href = pngFile; a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };
  return (
    <Dialog open={isOpen} onOpenChange={(o)=> !o && onClose()}>
      <DialogContent onClose={onClose} className="max-w-sm">
        <DialogHeader><DialogTitle>QR Code</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center py-2">
          <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
            <QRCodeSVG id="qr-code-svg" value={url} size={200} level="H" includeMargin={true} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center break-all">{url}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={downloadQR}><Download className="size-4" /> Download PNG</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
