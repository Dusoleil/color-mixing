import {glMatrix,vec2,vec3,vec4,mat2,mat3,mat4,quat} from "glMatrix"

export function point_to_point_distance(p1,p2)
{
    return vec3.distance(p1,p2);
}

export function barycentric_point(p,c)
{
    return [1];
}

export function scalar_project_onto_line(p,l1,l2)
{
    let a = vec3.create();
    vec3.subtract(a,p,l1);
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = vec3.dot(a,b);
    return scalar_proj;
}

export function project_onto_line(p,l1,l2)
{
    let b = vec3.create();
    vec3.subtract(b,l2,l1);
    vec3.normalize(b,b);
    let scalar_proj = scalar_project_onto_line(p,l1,l2);
    let proj = vec3.create();
    vec3.scale(proj,b,scalar_proj);
    vec3.add(proj,proj,l1);
    return proj;
}

export function barycentric_line(p,l1,l2)
{
    let scalar = scalar_project_onto_line(p,l1,l2);
    let dist = point_to_point_distance(l1,l2);
    let b1 = scalar / dist;
    let b0 = 1 - b1;
    return [b0,b1];
}

export function barycentric_line_bounded(p,l1,l2)
{
    let bary = barycentric_line(p,l1,l2);
    function clamp(min,val,max)
    {
        return Math.max(min,Math.min(val,max));
    }
    return [clamp(0,bary[0],1),clamp(0,bary[1],1)];
}

export function project_onto_line_segment(p,l1,l2)
{
    let bary = barycentric_line_bounded(p,l1,l2)[0];
    if(bary >= 1) return l1;
    if(bary <= 0) return l2;
    return project_onto_line(p,l1,l2);
}

export function point_to_line_distance(p,l1,l2)
{
    let projection = project_onto_line_segment(p,l1,l2);
    return point_to_point_distance(p,projection);
}

export function get_rotation_from_triangle_to_xy(t1,t2,t3)
{
    let t2_origin = vec3.create();
    let t3_origin = vec3.create();
    vec3.sub(t2_origin,t2,t1);
    vec3.sub(t3_origin,t3,t1);
    let triangle_normal = vec3.create();
    vec3.cross(triangle_normal,t2_origin,t3_origin);
    let target_axis = vec3.fromValues(0,0,1);
    let rotation_axis = vec3.create();
    vec3.cross(rotation_axis,triangle_normal,target_axis);
    vec3.normalize(rotation_axis,rotation_axis);
    let rotation_magnitude = vec3.angle(triangle_normal,target_axis);
    let rotation = quat.create();
    quat.setAxisAngle(rotation,rotation_axis,rotation_magnitude);
    return rotation;
}

export function project_onto_plane(p,t1,t2,t3)
{
    let rotation = get_rotation_from_triangle_to_xy(t1,t2,t3);
    let projection = vec3.create();
    vec3.sub(projection,p,t1);
    vec3.transformQuat(projection,projection,rotation);
    projection[2] = 0;
    quat.invert(rotation,rotation);
    vec3.transformQuat(projection,projection,rotation);
    vec3.add(projection,projection,t1);
    return projection;
}

export function barycentric_triangle(p,t1,t2,t3)
{
    let rotation = get_rotation_from_triangle_to_xy(t1,t2,t3);
    function project_xy(p)
    {
        let projection = vec3.create();
        vec3.transformQuat(projection,p,rotation);
        projection = vec2.fromValues(...projection);
        return projection;
    }
    let p_2d = project_xy(p);
    let t1_2d = project_xy(t1);
    let t2_2d = project_xy(t2);
    let t3_2d = project_xy(t3);
    let lin_eq_left = mat3.fromValues(...t1_2d,1,...t2_2d,1,...t3_2d,1);
    let lin_eq_right = vec3.fromValues(...p_2d,1);
    let inv_left = mat3.create();
    mat3.invert(inv_left,lin_eq_left);
    let solution = vec3.create();
    vec3.transformMat3(solution,lin_eq_right,inv_left);
    return solution;
}

export function barycentric_triangle_bounded(p,t1,t2,t3)
{
    let bary = barycentric_triangle(p,t1,t2,t3);
    if(bary[0] <= 0 || bary[1] <= 0 || bary[2] <= 0)
    {
        let dist_edge1 = point_to_line_distance(p,t1,t2);
        let dist_edge2 = point_to_line_distance(p,t2,t3);
        let dist_edge3 = point_to_line_distance(p,t1,t3);
        let min_dist = Math.min(dist_edge1,Math.min(dist_edge2,dist_edge3));
        if(min_dist == dist_edge1)
        {
            bary = barycentric_line_bounded(p,t1,t2);
            return [bary[0],bary[1],0];
        }
        else if(min_dist == dist_edge2)
        {
            bary = barycentric_line_bounded(p,t2,t3);
            return [0,bary[0],bary[1]];
        }
        else if(min_dist == dist_edge3)
        {
            bary = barycentric_line_bounded(p,t1,t3);
            return [bary[0],0,bary[1]];
        }
    }
    else
        return bary;
}

export function project_onto_triangle(p,t1,t2,t3)
{
    let bary = barycentric_triangle_bounded(p,t1,t2,t3);
    let sw = 0;
    if(bary[0] <= 0) sw += 1;
    if(bary[1] <= 0) sw += 2;
    if(bary[2] <= 0) sw += 4;
    switch(sw)
    {
        case 0:
            return project_onto_plane(p,t1,t2,t3);
        case 1:
            return project_onto_line_segment(p,t2,t3);
        case 2:
            return project_onto_line_segment(p,t1,t3);
        case 3:
            return t3;
        case 4:
            return project_onto_line_segment(p,t1,t2);
        case 5:
            return t2;
        case 6:
            return t1;
    }
}

export function point_to_triangle_distance(p,t1,t2,t3)
{
    let projection = project_onto_triangle(p,t1,t2,t3);
    return point_to_point_distance(p,projection);
}

export function barycentric_tetrahedron(p,t1,t2,t3,t4)
{
    let lin_eq_left = mat4.fromValues(...t1,1,...t2,1,...t3,1,...t4,1);
    let lin_eq_right = vec4.fromValues(...p,1);
    let inv_left = mat4.create();
    mat4.invert(inv_left,lin_eq_left);
    let solution = vec4.create();
    vec4.transformMat4(solution,lin_eq_right,inv_left);
    return solution;
}

export function barycentric_tetrahedron_bounded(p,t1,t2,t3,t4)
{
    let bary = barycentric_tetrahedron(p,t1,t2,t3,t4);
    if(bary[0] <= 0 || bary[1] <= 0 || bary[2] <= 0 || bary[3] <= 0)
    {
        let dist_face1 = point_to_triangle_distance(p,t1,t2,t3);
        let dist_face2 = point_to_triangle_distance(p,t1,t2,t4);
        let dist_face3 = point_to_triangle_distance(p,t1,t3,t4);
        let dist_face4 = point_to_triangle_distance(p,t2,t3,t4);
        let min_dist = Math.min(dist_face1,Math.min(dist_face2,Math.min(dist_face3,dist_face4)));
        if(min_dist == dist_face1)
        {
            bary = barycentric_triangle_bounded(p,t1,t2,t3);
            return [bary[0],bary[1],bary[2],0];
        }
        else if(min_dist == dist_face2)
        {
            bary = barycentric_triangle_bounded(p,t1,t2,t4);
            return [bary[0],bary[1],0,bary[2]];
        }
        else if(min_dist == dist_face3)
        {
            bary = barycentric_triangle_bounded(p,t1,t3,t4);
            return [bary[0],0,bary[1],bary[2]];
        }
        else if(min_dist == dist_face4)
        {
            bary = barycentric_triangle_bounded(p,t2,t3,t4);
            return [0,bary[0],bary[1],bary[2]];
        }
    }
    else
        return bary;
}

export function project_onto_tetrahedron(p,t1,t2,t3,t4)
{
    let bary = barycentric_tetrahedron_bounded(p,t1,t2,t3,t4);
    let sw = 0;
    if(bary[0] <= 0) sw += 1;
    if(bary[1] <= 0) sw += 2;
    if(bary[2] <= 0) sw += 4;
    if(bary[3] <= 0) sw += 8;
    switch(sw)
    {
        case 0:
            return p;
        case 1:
            return project_onto_triangle(p,t2,t3,t4);
        case 2:
            return project_onto_triangle(p,t1,t3,t4);
        case 3:
            return project_onto_line_segment(p,t3,t4);
        case 4:
            return project_onto_triangle(p,t1,t2,t4);
        case 5:
            return project_onto_line_segment(p,t2,t4);
        case 6:
            return project_onto_line_segment(p,t1,t3);
        case 7:
            return t4;
        case 8:
            return project_onto_triangle(p,t1,t2,t3);
        case 9:
            return project_onto_line_segment(p,t2,t3);
        case 10:
            return project_onto_line_segment(p,t1,t3);
        case 11:
            return t3;
        case 12:
            return project_onto_line_segment(p,t1,t2);
        case 13:
            return t2;
        case 14:
            return t1;
    }
}

export function point_to_tetrahedron_distance(p,t1,t2,t3,t4)
{
    let projection = project_onto_tetrahedron(p,t1,t2,t3,t4);
    return point_to_point_distance(p,projection);
}

export function angle_between_lines(a1,a2,b1,b2)
{
    let a = vec3.create();
    vec3.subtract(a,a2,a1);
    let b = vec3.create();
    vec3.subtract(b,b2,b1);
    let t = vec3.angle(a,b);
    return t;
}

export function angle_between_lines_q1(a1,a2,b1,b2)
{
    let t = angle_between_lines(a1,a2,b1,b2);
    if(t>(Math.PI/2))
        t = Math.PI - t;
    return t;
}

export function rad_to_deg(t)
{
    return t * (180/Math.PI);
}

export function project_onto_hull(p,h)
{
    if(h.length == 1)
        return h[0];
    if(h.length == 2)
        return project_onto_line_segment(p,h[0],h[1]);
    if(h.length == 3)
        return project_onto_triangle(p,h[0],h[1],h[2]);
    if(h.length >= 4)
        return project_onto_tetrahedron(p,h[0],h[1],h[2],h[3]);
}

export function barycentric_hull(p,h)
{
    if(h.length == 1)
        return barycentric_point(p,h[0]);
    if(h.length == 2)
        return barycentric_line(p,h[0],h[1]);
    if(h.length == 3)
        return barycentric_triangle(p,h[0],h[1],h[2]);
    if(h.length >= 4)
        return barycentric_tetrahedron(p,h[0],h[1],h[2],h[3]);
}

export function barycentric_hull_bounded(p,h)
{
    if(h.length == 1)
        return barycentric_point(p,h[0]);
    if(h.length == 2)
        return barycentric_line_bounded(p,h[0],h[1]);
    if(h.length == 3)
        return barycentric_triangle_bounded(p,h[0],h[1],h[2]);
    if(h.length >= 4)
        return barycentric_tetrahedron_bounded(p,h[0],h[1],h[2],h[3]);
}

export function calculate_setpoint(old_sp,old_anchor,new_anchor,old_bary,new_bary,old_anchor_bary,new_anchor_bary)
{
    if(new_bary <= 0) return 0;
    if(old_sp <= 0 || new_anchor <= 0 || old_anchor_bary <= 0 || old_anchor <= 0 || new_anchor_bary <= 0) return new_bary;
    if(old_bary <= 0) return old_sp;
    return (new_anchor*old_sp*old_anchor_bary*new_bary)/(old_anchor*new_anchor_bary*old_bary);
}

export function calculate_setpoints_fixed_sum(old_sp1,old_sp2,fixed_sum,old_bary1,old_bary2,new_bary1,new_bary2)
{
    if(fixed_sum <= 0) return [0,0];
    if(new_bary1 <= 0) return [0,fixed_sum];
    if(new_bary2 <= 0) return [fixed_sum,0];
    if(old_sp1 <= 0 || old_sp2 <= 0) return [new_bary1,new_bary2];
    if(old_bary1 <= 0) return [old_sp1,fixed_sum-old_sp1];
    if(old_bary2 <= 0) return [old_sp2,fixed_sum-old_sp2];
    let lin_eq_left = mat2.fromValues(-1*(old_sp2*old_bary1*new_bary2)/(old_sp1*new_bary1*old_bary2),1,1,1);
    let lin_eq_right = vec2.fromValues(0,fixed_sum);
    let inv_left = mat2.create();
    mat2.invert(inv_left,lin_eq_left);
    let solution = vec2.create();
    vec2.transformMat2(solution,lin_eq_right,inv_left);
    return solution;
}

export function predict_barycentric(old_sp,new_sp,old_bary)
{
    let lin_eq_left = [];
    let lin_eq_right = [];
    for(let j = 0; j < old_bary.length; j++)
    {
        for(let i = 1; i < old_bary.length; i++)
        {
            if(j==0)
                lin_eq_left.push(old_sp[0]*new_sp[i]*old_bary[i]);
            else if(i==j)
            {
                let l = -1*new_sp[0]*old_bary[0]*old_sp[i];
                lin_eq_left.push(l!=0?l:glMatrix.EPSILON);
            }
            else
                lin_eq_left.push(0);
        }
        lin_eq_left.push(1);
    }
    for(let i = 1; i < old_bary.length; i++)
        lin_eq_right.push(0);
    lin_eq_right.push(1);
    if(old_bary.length == 2)
    {
        lin_eq_left = mat2.clone(lin_eq_left);
        lin_eq_right = vec2.clone(lin_eq_right);
        let inv_left = mat2.create();
        mat2.invert(inv_left,lin_eq_left);
        let solution = vec2.create();
        vec2.transformMat2(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(old_bary.length == 3)
    {
        lin_eq_left = mat3.clone(lin_eq_left);
        lin_eq_right = vec3.clone(lin_eq_right);
        let inv_left = mat3.create();
        mat3.invert(inv_left,lin_eq_left);
        let solution = vec3.create();
        vec3.transformMat3(solution,lin_eq_right,inv_left);
        return solution;
    }
    if(old_bary.length == 4)
    {
        lin_eq_left = mat4.clone(lin_eq_left);
        lin_eq_right = vec4.clone(lin_eq_right);
        let inv_left = mat4.create();
        mat4.invert(inv_left,lin_eq_left);
        let solution = vec4.create();
        vec4.transformMat4(solution,lin_eq_right,inv_left);
        return solution;
    }
}

export function get_composite_from_barycentric(components,barycentric)
{
    let composite = vec3.create();
    for(let c in components)
    {
        let weighted = vec3.create();
        vec3.scale(weighted,components[c],barycentric[c]);
        vec3.add(composite,composite,weighted);
    }
    return composite;
}
