import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, isLoading, requireInputToConfirm, isDanger }: {
  isOpen: boolean; onClose: ()=>void; onConfirm: ()=>void; title: string; message: React.ReactNode; confirmText: string; isLoading?: boolean; requireInputToConfirm?: string; isDanger?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');
  useEffect(()=> { if(isOpen) setInputValue(''); }, [isOpen]);
  const disabled = isLoading || (requireInputToConfirm ? inputValue !== requireInputToConfirm : false);
  return (
    <Dialog open={isOpen} onOpenChange={(o)=> !o && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription asChild><div className="text-sm text-muted-foreground">{message}</div></DialogDescription></DialogHeader>
        {requireInputToConfirm && (
          <div>
            <label className="text-sm font-medium">Type <span className="font-mono font-semibold">{requireInputToConfirm}</span> to confirm</label>
            <Input value={inputValue} onChange={e=> setInputValue(e.target.value)} placeholder={requireInputToConfirm} className="mt-1.5" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant={isDanger? "destructive":"default"} onClick={onConfirm} disabled={disabled}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
