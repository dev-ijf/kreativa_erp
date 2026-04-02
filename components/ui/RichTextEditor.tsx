'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/FormFields';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({ value, onChange, className }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-violet-600 underline underline-offset-4 decoration-violet-300 hover:text-violet-700 transition-colors',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[220px] px-4 py-3 text-slate-700 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:mb-1',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') !== current) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  const promptLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Masukkan URL', prev ?? 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const isActive = (name: string | Record<string, any>, attributes?: any) => {
    if (typeof name === 'string') return editor.isActive(name, attributes);
    return (editor as any).isActive(name);
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-slate-400/20 focus-within:border-slate-400 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1.5 p-1 px-1.5 pr-2 border-r border-slate-200 mr-1">
          <Button
            type="button"
            size="sm"
            variant={isActive('bold') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('italic') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('underline') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('strike') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('code') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Code"
          >
            <Code size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 p-1 px-1.5 pr-2 border-r border-slate-200 mr-1">
          <Button
            type="button"
            size="sm"
            variant={isActive('heading', { level: 1 }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('heading', { level: 2 }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('heading', { level: 3 }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 p-1 px-1.5 pr-2 border-r border-slate-200 mr-1">
          <Button
            type="button"
            size="sm"
            variant={isActive('bulletList') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive('orderedList') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 p-1 px-1.5 pr-2 border-r border-slate-200 mr-1">
          <Button
            type="button"
            size="sm"
            variant={isActive({ textAlign: 'left' }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive({ textAlign: 'center' }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive({ textAlign: 'right' }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align Right"
          >
            <AlignRight size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isActive({ textAlign: 'justify' }) ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Align Justify"
          >
            <AlignJustify size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 p-1 px-1.5">
          <Button
            type="button"
            size="sm"
            variant={isActive('link') ? 'primary' : 'ghost'}
            className="h-9 w-9 p-0 rounded-lg"
            onClick={promptLink}
            title="Link"
          >
            <LinkIcon size={16} />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 p-1 px-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 size={16} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 size={16} />
          </Button>
        </div>

      </div>
      <EditorContent editor={editor} />
    </div>
  );
}


