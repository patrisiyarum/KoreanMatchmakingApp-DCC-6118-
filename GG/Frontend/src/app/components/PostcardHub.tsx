import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  PenLine,
  Send,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  ImagePlus,
  Paperclip,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getFriendsList, type FriendRow } from '@/api/friendsApi';
import { publicAssetUrl } from '../utils/profileImage';
import {
  sendPostcard,
  getReceivedPostcards,
  markPostcardRead,
  deletePostcard,
  getPostcardLimitStatus,
  getRecentMedia,
  uploadPostcardImage,
  type PostcardRow,
  type LimitStatus,
  type RecentMediaRow,
} from '@/api/postcardApi';
import {
  BACKGROUNDS,
  STICKERS,
  getBackground,
  getSticker,
  MAX_STICKERS,
  MAX_MESSAGE_LENGTH,
  SEND_WINDOW_HOURS,
  LIMIT_ENABLED,
} from '@/lib/postcardAssets';

// ---------------------------------------------------------------------------
// PostcardCanvas — the postcard rectangle, used in compose, preview & view
// Supports a 3-D CSS flip to reveal an image carousel on the back face.
// ---------------------------------------------------------------------------
type PostcardCanvasProps = {
  backgroundRef: string;
  stickerRefs: string[];
  message: string;
  editable?: boolean;
  onMessageChange?: (v: string) => void;
  senderName?: string;
  receiverName?: string;
  imageUrls?: string[];
  imagePlacement?: 'background' | 'attachment';
  isFlipped?: boolean;
  onFlip?: () => void;
};

function PostcardCanvas({
  backgroundRef,
  stickerRefs,
  message,
  editable = false,
  onMessageChange,
  senderName,
  receiverName,
  imageUrls = [],
  imagePlacement = 'attachment',
  isFlipped = false,
  onFlip,
}: PostcardCanvasProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => { setCurrentIndex(0); }, [imageUrls]);

  const bg = getBackground(backgroundRef);
  const textClass = bg.darkText ? 'text-neutral-800' : 'text-white';
  const dividerColor = bg.darkText ? 'border-neutral-400/40' : 'border-white/30';
  const lineColor = bg.darkText ? 'border-neutral-300/60' : 'border-white/20';

  const showAttachments = imagePlacement === 'attachment' && imageUrls.length > 0;
  const showBackFace = showAttachments;

  return (
    <div className="w-full" style={{ perspective: '1200px', aspectRatio: '3 / 2' }}>
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── FRONT FACE ────────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-xl border-2 border-neutral-200 overflow-hidden shadow-md${!editable && showAttachments && onFlip ? ' cursor-pointer' : ''}`}
          style={{ backfaceVisibility: 'hidden', ...bg.style }}
          onClick={!editable && showAttachments && onFlip ? onFlip : undefined}
        >
          {/* Background image overlay (dim) */}
          {imagePlacement === 'background' && imageUrls.length > 0 && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${publicAssetUrl(imageUrls[0]) ?? ''})`,
                opacity: 0.35,
              }}
            />
          )}

          {/* Left half: sticker zone */}
          <div className="absolute inset-y-0 left-0 w-[48%] flex flex-col justify-between p-3">
            <div className="flex flex-wrap gap-1">
              {stickerRefs.map((ref, i) => {
                const s = getSticker(ref);
                return s ? (
                  <span key={`${ref}-${i}`} className="text-2xl leading-none">{s.emoji}</span>
                ) : null;
              })}
            </div>
            <div className={`text-[10px] font-medium space-y-0.5 ${textClass} opacity-70`}>
              {receiverName && <p>To: {receiverName}</p>}
              {senderName && <p>From: {senderName}</p>}
            </div>
          </div>

          {/* Vertical divider */}
          <div className={`absolute inset-y-3 left-[48%] w-px border-l border-dashed ${dividerColor}`} />

          {/* Right half: message zone */}
          <div className="absolute inset-y-0 right-0 w-[52%] flex flex-col p-3 gap-1">
            <div className="absolute inset-x-3 top-3 bottom-6 flex flex-col justify-around pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`border-b ${lineColor}`} />
              ))}
            </div>
            {editable ? (
              <textarea
                className={`relative flex-1 bg-transparent resize-none text-sm leading-relaxed outline-none ${textClass} w-full pr-10`}
                placeholder="Write your message here…"
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(e) => onMessageChange?.(e.target.value)}
              />
            ) : (
              <p className={`relative flex-1 text-sm leading-relaxed break-words ${textClass}`}>
                {/* Stamp floated right — lives here so text reflows naturally around it */}
                <span
                  className={`float-right ml-1 mb-0.5 w-8 h-8 rounded border-2 ${bg.darkText ? 'border-neutral-400/40' : 'border-white/30'} flex items-center justify-center text-sm shrink-0`}
                >
                  📮
                </span>
                <span className="whitespace-pre-wrap break-words">
                  {message || <span className="opacity-40 italic">No message</span>}
                </span>
              </p>
            )}
            {editable && (
              <p className={`text-[10px] text-right ${textClass} opacity-50 shrink-0`}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </p>
            )}
          </div>

          {/* Stamp placeholder — only in editable mode; in display mode it lives inside the <p> as a float */}
          {editable && (
            <div className={`absolute top-2 right-2 w-8 h-8 rounded border-2 ${bg.darkText ? 'border-neutral-400/40' : 'border-white/30'} flex items-center justify-center text-sm`}>
              📮
            </div>
          )}

          {/* Attachment indicator — only on preview/view, bottom-right corner */}
          {showAttachments && !editable && (
            <div className={`absolute bottom-2 right-2 flex items-center gap-0.5 text-[9px] opacity-50 pointer-events-none ${textClass}`}>
              <Paperclip className="w-2.5 h-2.5" />
              <span>{imageUrls.length}</span>
            </div>
          )}
        </div>

        {/* ── BACK FACE (image viewer) ───────────────────────────────────── */}
        {showBackFace && (
          <div
            className="absolute inset-0 rounded-xl border-2 border-neutral-200 overflow-hidden shadow-md bg-neutral-50 cursor-pointer"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            onClick={onFlip}
          >
            {/* Stamp frame — shrinks to actual image size, capped so large images don't overflow */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                outline: '1.5px solid #d1d5db',
                outlineOffset: '3px',
                maxWidth: 'calc(100% - 40px)',
                maxHeight: 'calc(100% - 40px)',
                lineHeight: 0,
              }}
            >
              {/* No object-fit — browser scales <img> proportionally when both max dims are set,
                  so the element box equals the rendered pixels exactly (no letterbox gap) */}
              <img
                src={publicAssetUrl(imageUrls[currentIndex]) ?? ''}
                alt={`Attachment ${currentIndex + 1}`}
                style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>

            {/* Left arrow */}
            {imageUrls.length > 1 && currentIndex > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => i - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-neutral-600 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Right arrow */}
            {imageUrls.length > 1 && currentIndex < imageUrls.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => i + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-neutral-600 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Counter */}
            {imageUrls.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-[10px] text-neutral-500 bg-white/80 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} / {imageUrls.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini thumbnail for the inbox list
// ---------------------------------------------------------------------------
function PostcardThumb({ postcard }: { postcard: PostcardRow }) {
  const bg = getBackground(postcard.backgroundRef);
  const stickers = (postcard.stickerRefs ?? []).slice(0, 3);
  return (
    <div
      className="w-16 h-10 rounded-md shrink-0 overflow-hidden flex items-center justify-center gap-0.5 text-base"
      style={bg.style}
    >
      {stickers.length > 0
        ? stickers.map((ref, i) => {
            const s = getSticker(ref);
            return s ? <span key={i}>{s.emoji}</span> : null;
          })
        : <span className="text-xs opacity-40">✉</span>}
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function LimitBadge({ status }: { status: LimitStatus | null }) {
  if (!LIMIT_ENABLED || !status) return null;
  const { sentToday, limit, resetsAt } = status;

  if (sentToday >= limit) {
    const resetsIn = resetsAt
      ? Math.ceil((new Date(resetsAt).getTime() - Date.now()) / 3600000)
      : null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>
          {sentToday}/{limit} sent
          {resetsIn != null ? ` · resets in ~${resetsIn}h` : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5">
      <Send className="w-3.5 h-3.5 shrink-0" />
      <span>{sentToday}/{limit} sent</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type Tab = 'open' | 'compose';
type ComposeStep = 'create' | 'preview' | 'sent';

const MAX_IMAGES_BACKGROUND = 1;
const MAX_IMAGES_ATTACHMENT = 4;

export function PostcardHub() {
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab: Tab = searchParams.get('to') ? 'compose' : 'open';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [composeStep, setComposeStep] = useState<ComposeStep>('create');

  // ── Compose state ─────────────────────────────────────────────────────────
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    searchParams.get('to') ?? ''
  );
  const [selectedBackground, setSelectedBackground] = useState<string>('cream');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePlacement, setImagePlacement] = useState<'background' | 'attachment'>('attachment');
  const [isUploading, setIsUploading] = useState(false);
  const [composeFlipped, setComposeFlipped] = useState(false);
  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [recentMedia, setRecentMedia] = useState<RecentMediaRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Inbox state ───────────────────────────────────────────────────────────
  const [received, setReceived] = useState<PostcardRow[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [openedPostcard, setOpenedPostcard] = useState<PostcardRow | null>(null);
  const [modalFlipped, setModalFlipped] = useState(false);
  const [friendMap, setFriendMap] = useState<Record<string, FriendRow>>({});

  // ── Load friends ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoadingFriends(true);
    getFriendsList(userId)
      .then((rows) => {
        setFriends(rows);
        const map: Record<string, FriendRow> = {};
        rows.forEach((r) => { map[String(r.id)] = r; });
        setFriendMap(map);
      })
      .catch(() => toast.error(t('Could not load partners', '파트너를 불러오지 못했습니다')))
      .finally(() => setLoadingFriends(false));
  }, [userId, t]);

  // ── Load recent media ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    getRecentMedia(userId).then(setRecentMedia).catch(() => {});
  }, [userId]);

  // ── Fetch limit when partner changes ─────────────────────────────────────
  useEffect(() => {
    if (!userId || !selectedPartnerId) { setLimitStatus(null); return; }
    getPostcardLimitStatus(userId, selectedPartnerId)
      .then(setLimitStatus)
      .catch(() => setLimitStatus(null));
  }, [userId, selectedPartnerId]);

  // ── Load inbox ────────────────────────────────────────────────────────────
  const loadInbox = useCallback(async () => {
    if (!userId) return;
    setLoadingInbox(true);
    try {
      setReceived(await getReceivedPostcards(userId));
    } catch {
      toast.error(t('Could not load postcards', '엽서를 불러오지 못했습니다'));
    } finally {
      setLoadingInbox(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (activeTab === 'open') void loadInbox();
  }, [activeTab, loadInbox]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const switchToCompose = (partnerId = '') => {
    if (partnerId) setSelectedPartnerId(partnerId);
    setActiveTab('compose');
    setComposeStep('create');
    setComposeFlipped(false);
  };
  const switchToOpen = () => {
    setActiveTab('open');
    void loadInbox();
    setSearchParams({});
  };
  const resetCompose = () => {
    setSelectedPartnerId('');
    setSelectedBackground('cream');
    setSelectedStickers([]);
    setMessage('');
    setImageUrls([]);
    setImagePlacement('attachment');
    setComposeFlipped(false);
    setLimitStatus(null);
    setComposeStep('create');
  };
  const toggleSticker = (ref: string) => {
    setSelectedStickers((prev) => {
      if (prev.includes(ref)) return prev.filter((r) => r !== ref);
      if (prev.length >= MAX_STICKERS) { toast.error(`Max ${MAX_STICKERS} stickers`); return prev; }
      return [...prev, ref];
    });
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    const maxImages = imagePlacement === 'background' ? MAX_IMAGES_BACKGROUND : MAX_IMAGES_ATTACHMENT;
    if (imageUrls.length >= maxImages) {
      toast.error(
        imagePlacement === 'background'
          ? 'Background placement supports 1 image'
          : `Maximum ${MAX_IMAGES_ATTACHMENT} images`
      );
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadPostcardImage(userId, file);
      setImageUrls((prev) => [...prev, url]);
    } catch {
      toast.error('Could not upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // When switching placement, enforce image limits
  const handlePlacementChange = (p: 'background' | 'attachment') => {
    setImagePlacement(p);
    if (p === 'background' && imageUrls.length > MAX_IMAGES_BACKGROUND) {
      setImageUrls((prev) => prev.slice(0, MAX_IMAGES_BACKGROUND));
      toast.info('Trimmed to 1 image for background placement');
    }
    setComposeFlipped(false);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!userId || !selectedPartnerId) return;
    setSending(true);
    try {
      const result = await sendPostcard(userId, selectedPartnerId, {
        message,
        backgroundRef: selectedBackground,
        stickerRefs: selectedStickers,
        imageUrls,
        imagePlacement,
      });
      if (!result) throw new Error('No response from server');
      setComposeStep('sent');
      getRecentMedia(userId).then(setRecentMedia).catch(() => {});
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not send postcard';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  // ── Open a postcard ───────────────────────────────────────────────────────
  const handleOpenPostcard = async (postcard: PostcardRow) => {
    setOpenedPostcard(postcard);
    setModalFlipped(false);
    if (!postcard.readAt && userId) {
      await markPostcardRead(postcard.id, userId);
      setReceived((prev) =>
        prev.map((p) => p.id === postcard.id ? { ...p, readAt: new Date().toISOString() } : p)
      );
    }
  };

  // ── Delete a received postcard ────────────────────────────────────────────
  const handleDelete = async (postcard: PostcardRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    const ok = await deletePostcard(postcard.id, userId);
    if (ok) {
      setReceived((prev) => prev.filter((p) => p.id !== postcard.id));
      if (openedPostcard?.id === postcard.id) {
        setOpenedPostcard(null);
        setModalFlipped(false);
      }
      toast.success(t('Postcard deleted', '엽서를 삭제했습니다'));
    } else {
      toast.error(t('Could not delete postcard', '엽서를 삭제하지 못했습니다'));
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedPartner = useMemo(
    () => (selectedPartnerId ? friendMap[selectedPartnerId] : undefined),
    [selectedPartnerId, friendMap]
  );
  const recentStickers = useMemo(
    () => recentMedia.filter((r) => r.assetType === 'sticker').map((r) => r.assetRef),
    [recentMedia]
  );
  const unreadCount = useMemo(() => received.filter((p) => !p.readAt).length, [received]);
  const canPreview = !!selectedPartnerId && (LIMIT_ENABLED ? limitStatus?.remaining !== 0 : true);

  // ── Render: compose step 1 ────────────────────────────────────────────────
  const renderComposeCreate = () => (
    <div className="space-y-5">
      {/* Partner selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">{t('Send to', '받는 사람')}</label>
        {loadingFriends ? (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading partners…
          </div>
        ) : friends.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('No partners yet — start swiping!', '아직 파트너가 없습니다')}</p>
        ) : (
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">{t('— Choose a partner —', '— 파트너 선택 —')}</option>
            {friends.map((f) => (
              <option key={f.id} value={String(f.id)}>
                {`${f.firstName || ''} ${f.lastName || ''}`.trim() || `Partner #${f.id}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedPartnerId && <LimitBadge status={limitStatus} />}

      {/* Postcard canvas */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">{t('Design your postcard', '엽서 디자인')}</p>
        <PostcardCanvas
          backgroundRef={selectedBackground}
          stickerRefs={selectedStickers}
          message={message}
          editable
          onMessageChange={setMessage}
          receiverName={selectedPartner ? `${selectedPartner.firstName || ''} ${selectedPartner.lastName || ''}`.trim() : undefined}
          senderName="You"
          imageUrls={imageUrls}
          imagePlacement={imagePlacement}
          isFlipped={composeFlipped}
          onFlip={imageUrls.length > 0 && imagePlacement === 'attachment' ? () => setComposeFlipped((v) => !v) : undefined}
        />
      </div>

      {/* Background picker */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">{t('Background', '배경')}</p>
        <div className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((bg) => {
            const isSelected = selectedBackground === bg.ref;
            return (
              <button
                key={bg.ref}
                type="button"
                onClick={() => setSelectedBackground(bg.ref)}
                title={bg.label}
                className={`w-10 h-10 rounded-lg transition-all duration-150 ${
                  isSelected ? 'scale-110 shadow-md' : 'hover:scale-105'
                }`}
                style={bg.style}
              />
            );
          })}
        </div>
      </div>

      {/* Sticker picker */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-1">
          {t('Stickers', '스티커')}{' '}
          <span className="text-neutral-400 font-normal text-xs">({selectedStickers.length}/{MAX_STICKERS})</span>
        </p>
        {recentStickers.length > 0 && (
          <>
            <p className="text-[11px] text-neutral-400 mb-1">{t('Recently used', '최근 사용')}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recentStickers.slice(0, 5).map((ref) => {
                const s = getSticker(ref);
                if (!s) return null;
                const active = selectedStickers.includes(ref);
                return (
                  <button key={ref} type="button" title={s.label} onClick={() => toggleSticker(ref)}
                    className={`w-9 h-9 rounded-lg border text-xl flex items-center justify-center transition-all ${active ? 'border-violet-600 bg-violet-50 scale-110' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}>
                    {s.emoji}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-400 mb-1">{t('All stickers', '전체 스티커')}</p>
          </>
        )}
        <div className="flex flex-wrap gap-1.5">
          {STICKERS.map((s) => {
            const active = selectedStickers.includes(s.ref);
            return (
              <button key={s.ref} type="button" title={s.label} onClick={() => toggleSticker(s.ref)}
                className={`w-9 h-9 rounded-lg border text-xl flex items-center justify-center transition-all ${active ? 'border-violet-600 bg-violet-50 scale-110' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}>
                {s.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Image upload */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-2">
          {t('Photos', '사진')}{' '}
          <span className="text-neutral-400 font-normal text-xs">
            ({imageUrls.length}/{imagePlacement === 'background' ? MAX_IMAGES_BACKGROUND : MAX_IMAGES_ATTACHMENT})
          </span>
        </p>

        {/* Placement toggle — only show when at least 1 image is uploaded */}
        {imageUrls.length > 0 && (
          <div className="flex rounded-lg bg-neutral-100 p-0.5 gap-0.5 mb-3 w-fit">
            <button
              type="button"
              onClick={() => handlePlacementChange('background')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                imagePlacement === 'background'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {t('Background', '배경')}
            </button>
            <button
              type="button"
              onClick={() => handlePlacementChange('attachment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                imagePlacement === 'attachment'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              {t('Attachment', '첨부')}
            </button>
          </div>
        )}

        {/* Uploaded thumbnails */}
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative">
                {/* Stamp-style frame */}
                <div
                  className="w-20 h-14 bg-white shadow-sm p-1 flex items-center justify-center overflow-hidden"
                  style={{ outline: '1.5px solid #d1d5db', outlineOffset: '2px' }}
                >
                  <img src={publicAssetUrl(url) ?? ''} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => void handleImageUpload(e)}
        />
        <button
          type="button"
          disabled={
            isUploading ||
            (imagePlacement === 'background' && imageUrls.length >= MAX_IMAGES_BACKGROUND) ||
            (imagePlacement === 'attachment' && imageUrls.length >= MAX_IMAGES_ATTACHMENT)
          }
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {isUploading ? t('Uploading…', '업로드 중…') : t('Add Photo', '사진 추가')}
        </button>

        {imageUrls.length === 0 && (
          <p className="text-[11px] text-neutral-400 mt-1.5">
            {t('Background: dims behind content · Attachment: tap postcard to browse', '배경: 뒤에 흐릿하게 · 첨부: 탭해서 보기')}
          </p>
        )}
      </div>

      {/* Preview button */}
      <button
        type="button"
        disabled={!canPreview}
        onClick={() => { setComposeStep('preview'); setComposeFlipped(false); }}
        className="w-full bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {t('Preview Postcard →', '엽서 미리보기 →')}
      </button>
    </div>
  );

  // ── Render: compose step 2 (preview) ─────────────────────────────────────
  const renderComposePreview = () => (
    <div className="space-y-5">
      <p className="text-sm text-neutral-600 text-center">
        {t('This is exactly how your postcard will look when received.', '받는 사람에게 이렇게 보입니다.')}
      </p>

      <PostcardCanvas
        backgroundRef={selectedBackground}
        stickerRefs={selectedStickers}
        message={message}
        editable={false}
        receiverName={selectedPartner ? `${selectedPartner.firstName || ''} ${selectedPartner.lastName || ''}`.trim() : undefined}
        senderName="You"
        imageUrls={imageUrls}
        imagePlacement={imagePlacement}
        isFlipped={composeFlipped}
        onFlip={imageUrls.length > 0 && imagePlacement === 'attachment' ? () => setComposeFlipped((v) => !v) : undefined}
      />

      {imagePlacement === 'attachment' && imageUrls.length > 0 && (
        <p className="text-xs text-neutral-500 text-center">
          {t('Tap the postcard to browse attached photos', '엽서를 탭해 첨부 사진을 확인하세요')}
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => { setComposeStep('create'); setComposeFlipped(false); }}
          className="flex-1 border border-neutral-200 text-neutral-700 py-3 rounded-xl font-medium hover:bg-neutral-50 flex items-center justify-center gap-2 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {t('Edit', '수정')}
        </button>
        <button type="button" disabled={sending || (LIMIT_ENABLED && limitStatus?.remaining === 0)}
          onClick={() => void handleSend()}
          className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? t('Sending…', '전송 중…') : t('Send Postcard', '엽서 보내기')}
        </button>
      </div>
    </div>
  );

  // ── Render: compose step 3 (sent) ─────────────────────────────────────────
  const renderComposeSent = () => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center gap-5 py-10">
      <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-violet-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-1">{t('Postcard Sent!', '엽서를 보냈습니다!')}</h3>
        <p className="text-neutral-600 text-sm">
          {selectedPartner
            ? t(`${selectedPartner.firstName} will see your postcard soon.`, `${selectedPartner.firstName}이(가) 곧 엽서를 받습니다.`)
            : t('Your postcard is on its way!', '엽서가 전송되었습니다!')}
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <button type="button" onClick={switchToOpen}
          className="flex-1 border border-neutral-200 text-neutral-700 py-2.5 rounded-xl font-medium hover:bg-neutral-50 transition-colors">
          {t('Open Inbox', '받은 엽서함')}
        </button>
        <button type="button" onClick={() => { resetCompose(); switchToCompose(); }}
          className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors">
          {t('Send Another', '다른 엽서 보내기')}
        </button>
      </div>
    </motion.div>
  );

  // ── Render: inbox ─────────────────────────────────────────────────────────
  const renderInbox = () => {
    if (loadingInbox) {
      return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
    }
    if (received.length === 0) {
      return (
        <div className="flex flex-col items-center text-center gap-4 py-16">
          <div className="text-6xl">📭</div>
          <h3 className="text-lg font-semibold text-neutral-900">{t('No postcards yet', '아직 엽서가 없습니다')}</h3>
          <p className="text-neutral-600 text-sm max-w-xs">
            {t('When a partner sends you a postcard it will appear here.', '파트너가 엽서를 보내면 여기에 표시됩니다.')}
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {received.map((postcard, i) => {
          const sender = friendMap[String(postcard.senderId)];
          const senderName = sender
            ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim()
            : `Partner #${postcard.senderId}`;
          const isUnread = !postcard.readAt;
          return (
            <motion.button key={postcard.id} type="button"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => void handleOpenPostcard(postcard)}
              className="group w-full bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 text-left">
              <PostcardThumb postcard={postcard} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {isUnread && <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />}
                  <p className={`font-medium text-neutral-900 truncate ${isUnread ? 'font-semibold' : ''}`}>{senderName}</p>
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  {postcard.message
                    ? postcard.message.slice(0, 60) + (postcard.message.length > 60 ? '…' : '')
                    : <em>No message</em>}
                </p>
                {postcard.imagePlacement === 'attachment' && (postcard.imageUrls?.length ?? 0) > 0 && (
                  <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                    <Paperclip className="w-2.5 h-2.5" />
                    {postcard.imageUrls.length} photo{postcard.imageUrls.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right flex flex-col items-end gap-1">
                <p className="text-[11px] text-neutral-400">{relativeTime(postcard.sentAt)}</p>
                {sender?.profileImage && publicAssetUrl(sender.profileImage) ? (
                  <img src={publicAssetUrl(sender.profileImage)} alt="" className="w-8 h-8 rounded-full object-cover border border-neutral-200" />
                ) : null}
                <button
                  type="button"
                  onClick={(e) => void handleDelete(postcard, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500"
                  title={t('Delete postcard', '엽서 삭제')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  // ── Render: opened postcard modal ─────────────────────────────────────────
  const renderPostcardModal = () => {
    if (!openedPostcard) return null;
    const sender = friendMap[String(openedPostcard.senderId)];
    const senderName = sender
      ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim()
      : `Partner #${openedPostcard.senderId}`;
    const hasAttachments =
      openedPostcard.imagePlacement === 'attachment' && (openedPostcard.imageUrls?.length ?? 0) > 0;

    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => { setOpenedPostcard(null); setModalFlipped(false); }}>
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">{t('From', '보낸 사람')}: {senderName}</p>
                <p className="text-xs text-neutral-400">{relativeTime(openedPostcard.sentAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => void handleDelete(openedPostcard, e)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                  title={t('Delete postcard', '엽서 삭제')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => { setOpenedPostcard(null); setModalFlipped(false); }}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            </div>

            <PostcardCanvas
              backgroundRef={openedPostcard.backgroundRef}
              stickerRefs={openedPostcard.stickerRefs ?? []}
              message={openedPostcard.message ?? ''}
              editable={false}
              senderName={senderName}
              imageUrls={openedPostcard.imageUrls ?? []}
              imagePlacement={openedPostcard.imagePlacement ?? 'attachment'}
              isFlipped={modalFlipped}
              onFlip={hasAttachments ? () => setModalFlipped((v) => !v) : undefined}
            />

            {hasAttachments && (
              <p className="text-xs text-neutral-500 text-center">
                {t('Tap the postcard to browse attached photos', '엽서를 탭해 첨부 사진을 확인하세요')}
              </p>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ── Shell ─────────────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="size-full flex items-center justify-center p-6">
        <p className="text-neutral-600 text-center text-sm">
          {t('Sign in to send and receive postcards.', '로그인하고 엽서를 주고받으세요.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="size-full overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-5">
          {/* Back to partners */}
          <Link to="/partners"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors -mb-1">
            <ArrowLeft className="w-4 h-4" />
            {t('Partners', '파트너')}
          </Link>

          {/* Page header */}
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">{t('Postcards', '엽서')}</h2>
            <p className="text-neutral-600 text-sm">
              {t('Share a piece of your culture with your partners.', '문화의 일부를 파트너와 나누세요.')}
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex rounded-xl bg-neutral-100 p-1 gap-1">
            <button type="button" onClick={switchToOpen}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'open' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}>
              <Mail className="w-4 h-4" />
              {t('Open', '받은 엽서')}
              {unreadCount > 0 && activeTab !== 'open' && (
                <span className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-violet-600 text-white text-[10px] leading-[1.1rem] text-center font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button type="button" onClick={() => switchToCompose()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'compose' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}>
              <PenLine className="w-4 h-4" />
              {t('Compose', '작성')}
            </button>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'open' ? (
              <motion.div key="open" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                {renderInbox()}
              </motion.div>
            ) : (
              <motion.div key={`compose-${composeStep}`}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                {composeStep !== 'sent' && (
                  <div className="flex items-center gap-3 mb-5">
                    {composeStep === 'preview' && (
                      <button type="button" onClick={() => { setComposeStep('create'); setComposeFlipped(false); }}
                        className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-neutral-600" />
                      </button>
                    )}
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {composeStep === 'create' ? t('Create Postcard', '엽서 만들기') : t('Preview', '미리보기')}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {composeStep === 'create' ? t('Step 1 of 2', '1/2단계') : t('Step 2 of 2', '2/2단계')}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-1.5">
                      {(['create', 'preview'] as const).map((step) => (
                        <div key={step} className={`w-2 h-2 rounded-full transition-colors ${composeStep === step ? 'bg-violet-600' : 'bg-neutral-200'}`} />
                      ))}
                    </div>
                  </div>
                )}
                {composeStep === 'create' && renderComposeCreate()}
                {composeStep === 'preview' && renderComposePreview()}
                {composeStep === 'sent' && renderComposeSent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {renderPostcardModal()}
    </>
  );
}
