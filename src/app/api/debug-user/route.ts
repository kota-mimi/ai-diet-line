import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId } = await request.json();
    
    if (!lineUserId) {
      return NextResponse.json({ error: 'LINE User ID is required' }, { status: 400 });
    }
    
    console.log('🔍 ユーザー情報調査開始:', lineUserId);
    
    const db = admin.firestore();
    
    // ユーザー基本情報
    const userDoc = await db.collection('users').doc(lineUserId).get();
    const userExists = userDoc.exists;
    const userData = userExists ? userDoc.data() : null;
    
    // 今日の記録
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const recordDoc = await db.collection('users').doc(lineUserId).collection('dailyRecords').doc(today).get();
    const todayRecord = recordDoc.exists ? recordDoc.data() : null;
    
    // 一時データ確認
    const tempDoc = await db.collection('users').doc(lineUserId).collection('tempMealData').doc('current').get();
    const tempData = tempDoc.exists ? tempDoc.data() : null;
    
    return NextResponse.json({
      lineUserId,
      userExists,
      userData: userData ? {
        hasProfile: !!userData.profile,
        createdAt: userData.createdAt?.toDate?.()?.toISOString(),
        lastActiveAt: userData.lastActiveAt?.toDate?.()?.toISOString(),
      } : null,
      todayRecord: todayRecord ? {
        mealCount: (todayRecord.meals || []).length,
        lastModified: todayRecord.lastModified?.toDate?.()?.toISOString(),
      } : null,
      tempData: tempData ? {
        hasData: true,
        createdAt: tempData.createdAt?.toDate?.()?.toISOString(),
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Debug user error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}